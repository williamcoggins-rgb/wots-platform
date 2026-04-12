import * as admin from 'firebase-admin';
import cors from 'cors';
import cron from 'node-cron';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import { getAssistantResponse, createNewSession } from './assistant';
import { generateContent, buildContentItem } from './pipeline';
import { ChatMessage, ApiResponse, ContentPipelineConfig } from './types';

dotenv.config();

const serviceAccount = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : undefined;

admin.initializeApp(serviceAccount ? {
  credential: admin.credential.cert(serviceAccount),
} : undefined);

const db = admin.firestore();
const app = express();
const router = express.Router();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5000'];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ================================================================
// Visitor intelligence + analytics helpers
// ================================================================

function getClientIp(req: express.Request): string {
  const forwardedFor = (req.headers['x-forwarded-for'] as string) || '';
  const ip = forwardedFor.split(',')[0].trim() || req.socket.remoteAddress || '';
  return ip.replace(/^::ffff:/, '');
}

function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT || 'wots-default-salt';
  return crypto.createHash('sha256').update(salt + ip).digest('hex');
}

function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = !isTablet && /Mobile|Android|iPhone|iPod/i.test(ua);
  const device = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

  let os = 'Unknown';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  return { device, browser, os };
}

async function lookupGeo(ip: string): Promise<{ country?: string; region?: string; city?: string }> {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    return {};
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return {};
    const data = await res.json() as { country_name?: string; region?: string; city?: string; error?: boolean };
    if (data.error) return {};
    return {
      country: data.country_name,
      region: data.region,
      city: data.city,
    };
  } catch {
    return {};
  }
}

// ================================================================
// Resend email helpers
// ================================================================

const RESEND_AUDIENCE_NAME = 'WOTS Seekers';
let cachedAudienceId: string | null = null;

async function resendRequest(path: string, method: string, body?: unknown): Promise<any> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');
  const res = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${data.message || text}`);
  }
  return data;
}

async function getOrCreateAudienceId(): Promise<string | null> {
  if (cachedAudienceId) return cachedAudienceId;
  if (!process.env.RESEND_API_KEY) return null;
  try {
    const list = await resendRequest('/audiences', 'GET');
    const existing = (list.data || []).find((a: { name: string; id: string }) => a.name === RESEND_AUDIENCE_NAME);
    if (existing) {
      cachedAudienceId = existing.id;
      return cachedAudienceId;
    }
    const created = await resendRequest('/audiences', 'POST', { name: RESEND_AUDIENCE_NAME });
    cachedAudienceId = created.id;
    return cachedAudienceId;
  } catch (err) {
    console.error('Resend audience lookup failed:', err);
    return null;
  }
}

async function addToResendAudience(email: string): Promise<boolean> {
  const audienceId = await getOrCreateAudienceId();
  if (!audienceId) return false;
  try {
    await resendRequest(`/audiences/${audienceId}/contacts`, 'POST', {
      email,
      unsubscribed: false,
    });
    return true;
  } catch (err) {
    console.error('Resend contact add failed:', err);
    return false;
  }
}

function welcomeEmailHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>The Archive Opens</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#151515;border:1px solid #2A2A2A;border-radius:4px;">
          <tr>
            <td style="padding:48px 40px 32px;text-align:center;border-bottom:1px solid #2A2A2A;">
              <p style="margin:0 0 8px;font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#E88A1A;font-weight:700;">War of the Sphinx</p>
              <h1 style="margin:0;font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif;font-size:32px;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;color:#FFFFFF;line-height:1.1;">The Archive Opens</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#DDDDDD;">Seeker,</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#DDDDDD;">You've come to the door. That alone is more than most. The sand remembers every footprint, and now it knows yours.</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.7;color:#DDDDDD;">I am <span style="color:#E88A1A;font-weight:600;">The Griot</span>. I keep the record. I hold the names. When the first volume breaks its silence — you will know before the rest of the world does.</p>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.7;color:#DDDDDD;">Until then — ask. Come back often. The archive unfolds for those who return.</p>
              <div style="text-align:center;margin:32px 0 8px;">
                <a href="https://wots-platform-11435.web.app/chat" style="display:inline-block;padding:14px 32px;background:#E88A1A;color:#FFFFFF;font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:2px;">Speak with The Griot</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #2A2A2A;text-align:center;">
              <p style="margin:0 0 6px;font-family:'Arial Narrow','Roboto Condensed',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666666;">— The Griot</p>
              <p style="margin:0;font-size:12px;color:#666666;line-height:1.5;">The Sphinx remembers those who arrived first.</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#555555;">&copy; 2026 War of the Sphinx. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendWelcomeEmail(to: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set — skipping welcome email');
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL || 'The Griot <onboarding@resend.dev>';
  try {
    await resendRequest('/emails', 'POST', {
      from,
      to: [to],
      subject: 'The Archive Opens',
      html: welcomeEmailHtml(),
    });
    return true;
  } catch (err) {
    console.error('Welcome email send failed:', err);
    return false;
  }
}

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'wots-api', timestamp: Date.now() });
});

// Chat endpoint - send message to the Sphinx
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, userId } = req.body;
    if (!message || !userId) {
      res.status(400).json({ success: false, error: 'Missing message or userId' } as ApiResponse);
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, error: 'API key not configured' } as ApiResponse);
      return;
    }

    let session;
    if (sessionId) {
      const doc = await db.collection('sessions').doc(sessionId).get();
      if (doc.exists) {
        session = doc.data() as ReturnType<typeof createNewSession>;
      }
    }

    if (!session) {
      session = createNewSession(userId);
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    session.messages.push(userMessage);

    const responseText = await getAssistantResponse(session.messages, session.context, apiKey);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
    };
    session.messages.push(assistantMessage);
    session.updatedAt = Date.now();

    await db.collection('sessions').doc(session.id).set(session);

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        message: assistantMessage,
      },
    } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Get chat session history
router.get('/chat/:sessionId', async (req, res) => {
  try {
    const doc = await db.collection('sessions').doc(req.params.sessionId).get();
    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Session not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: doc.data() } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Content pipeline - generate new content
router.post('/content/generate', async (req, res) => {
  try {
    const config: ContentPipelineConfig = req.body;
    if (!config.contentType || !config.prompt) {
      res.status(400).json({ success: false, error: 'Missing contentType or prompt' } as ApiResponse);
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      res.status(500).json({ success: false, error: 'API key not configured' } as ApiResponse);
      return;
    }

    const rawContent = await generateContent(config, apiKey);
    const contentItem = buildContentItem(rawContent);

    await db.collection('content').doc(contentItem.id).set(contentItem);

    res.json({ success: true, data: contentItem } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// List content
router.get('/content', async (req, res) => {
  try {
    const type = req.query.type as string | undefined;
    const status = req.query.status as string | undefined;
    let query: admin.firestore.Query = db.collection('content');

    if (type) query = query.where('type', '==', type);
    if (status) query = query.where('status', '==', status);

    const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
    const items = snapshot.docs.map((doc) => doc.data());

    res.json({ success: true, data: items } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Get single content item
router.get('/content/:id', async (req, res) => {
  try {
    const doc = await db.collection('content').doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Content not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: doc.data() } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Email subscriber signup
router.post('/subscribe', async (req, res) => {
  try {
    const { email, source } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid email required' } as ApiResponse);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const signupSource = typeof source === 'string' && source ? source : 'homepage';

    // Check for duplicate
    const existing = await db.collection('email_subscribers')
      .where('email', '==', normalizedEmail).limit(1).get();
    if (!existing.empty) {
      res.json({ success: true, data: { message: 'Already enrolled' } } as ApiResponse);
      return;
    }

    // Fire-and-forget Resend audience add + welcome email (don't block on Resend)
    const [addedToAudience, welcomeSent] = await Promise.all([
      addToResendAudience(normalizedEmail),
      sendWelcomeEmail(normalizedEmail),
    ]);

    await db.collection('email_subscribers').add({
      email: normalizedEmail,
      subscribedAt: Date.now(),
      source: signupSource,
      addedToResend: addedToAudience,
      welcomeEmailSent: welcomeSent,
    });

    res.json({ success: true, data: { message: 'Welcome, Seeker' } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Subscribe error:', errMsg);
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Visitor intelligence — called silently on every frontend route change
router.post('/track-visit', async (req, res) => {
  try {
    const { sessionId, page, referrer } = req.body;
    if (!sessionId || !page) {
      res.status(400).json({ success: false, error: 'Missing sessionId or page' } as ApiResponse);
      return;
    }

    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] as string || '';
    const { device, browser, os } = parseUserAgent(userAgent);
    const geo = await lookupGeo(ip);

    await db.collection('visitor_sessions').add({
      sessionId: String(sessionId),
      ip_hash: hashIp(ip),
      country: geo.country || null,
      region: geo.region || null,
      city: geo.city || null,
      page: String(page),
      referrer: typeof referrer === 'string' ? referrer : null,
      device,
      browser,
      os,
      timestamp: Date.now(),
    });

    res.json({ success: true, data: { country: geo.country || null } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Track visit error:', errMsg);
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Analytics aggregation for admin panel
router.get('/analytics', async (_req, res) => {
  try {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const since = Date.now() - THIRTY_DAYS_MS;

    const [visitsSnap, subsSnap, sessionsSnap] = await Promise.all([
      db.collection('visitor_sessions').where('timestamp', '>=', since).get(),
      db.collection('email_subscribers').get(),
      db.collection('sessions').get(),
    ]);

    const visitsByCountry: Record<string, number> = {};
    const visitsByPage: Record<string, number> = {};
    const uniqueVisitors = new Set<string>();

    visitsSnap.forEach((doc) => {
      const v = doc.data();
      const country = v.country || 'Unknown';
      visitsByCountry[country] = (visitsByCountry[country] || 0) + 1;
      const page = v.page || '/';
      visitsByPage[page] = (visitsByPage[page] || 0) + 1;
      if (v.ip_hash) uniqueVisitors.add(v.ip_hash as string);
    });

    // Count chat messages (user role only)
    let chatMessageCount = 0;
    sessionsSnap.forEach((doc) => {
      const s = doc.data();
      if (Array.isArray(s.messages)) {
        chatMessageCount += s.messages.filter((m: { role: string }) => m.role === 'user').length;
      }
    });

    const topCountries = Object.entries(visitsByCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));

    const topPages = Object.entries(visitsByPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, count]) => ({ page, count }));

    res.json({
      success: true,
      data: {
        windowDays: 30,
        totalVisits: visitsSnap.size,
        uniqueVisitors: uniqueVisitors.size,
        topCountries,
        topPages,
        signupCount: subsSnap.size,
        chatMessageCount,
      },
    } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Analytics error:', errMsg);
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Text-to-speech via ElevenLabs (The Griot voice)
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'Missing text' } as ApiResponse);
      return;
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !voiceId) {
      console.error('TTS: ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not set');
      res.status(500).json({ success: false, error: 'ElevenLabs not configured' } as ApiResponse);
      return;
    }

    console.log(`TTS: Requesting audio for ${text.length} chars, voice=${voiceId}`);

    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.substring(0, 5000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!ttsRes.ok) {
      const errBody = await ttsRes.text();
      console.error(`TTS: ElevenLabs returned ${ttsRes.status}: ${errBody}`);
      res.status(ttsRes.status).json({ success: false, error: `ElevenLabs error: ${errBody}` } as ApiResponse);
      return;
    }

    const audioBuffer = Buffer.from(await ttsRes.arrayBuffer());
    console.log(`TTS: Returning ${audioBuffer.length} bytes of audio`);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(audioBuffer.length),
      'Cache-Control': 'public, max-age=86400',
    });
    res.send(audioBuffer);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('TTS: Unexpected error:', errMsg);
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Update content status
router.patch('/content/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' } as ApiResponse);
      return;
    }

    const ref = db.collection('content').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) {
      res.status(404).json({ success: false, error: 'Content not found' } as ApiResponse);
      return;
    }

    await ref.update({ status, updatedAt: Date.now() });
    res.json({ success: true, data: { id: req.params.id, status } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Schedule content generation (runs daily at midnight)
if (process.env.NODE_ENV === 'production') {
  cron.schedule('0 0 * * *', async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return;
    }

    const contentTypes: ContentPipelineConfig[] = [
      { contentType: 'lore', prompt: 'Generate a new piece of ancient lore about the world of the Sphinx.' },
      { contentType: 'quest', prompt: 'Generate a new side quest for players exploring the world.' },
    ];

    for (const config of contentTypes) {
      try {
        const rawContent = await generateContent(config, apiKey);
        const contentItem = buildContentItem(rawContent);
        await db.collection('content').doc(contentItem.id).set(contentItem);
        console.log(`Generated ${config.contentType}: ${contentItem.title}`);
      } catch (error) {
        console.error(`Failed to generate ${config.contentType}:`, error);
      }
    }
  });
}

// Mount all routes under /api
app.use('/api', router);

const PORT = process.env.PORT || 3001;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`WOTS API listening on 0.0.0.0:${PORT}`);
});

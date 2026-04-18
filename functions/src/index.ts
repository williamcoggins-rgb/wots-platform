import * as admin from 'firebase-admin';
import cors from 'cors';
import cron from 'node-cron';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

// Railway/Fly/most PaaS sit behind a reverse proxy; trust it so req.ip
// reflects the real client IP from x-forwarded-for (required for rate limits).
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:5000'];
app.use(cors({ origin: allowedOrigins }));
app.use(helmet());
app.use(express.json());

// ================================================================
// Rate limiting — per-IP caps to prevent abuse and bill runup.
// Both Anthropic and ElevenLabs are pay-per-use; these limits assume
// the site is single-instance (in-memory store is fine on Railway).
// ================================================================

const rateLimitError = (message: string) => ({
  success: false,
  error: message,
});

// Chat: ~1 message every 4s sustained, burst protection for scraping
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitError('Too many messages. Wait a moment before asking again.'),
});

const chatHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitError('Hourly chat limit reached. Come back later.'),
});

// TTS: ElevenLabs charges per character — keep this tighter than chat
const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitError('Too many voice requests. Wait a moment.'),
});

const ttsHourlyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitError('Hourly voice limit reached.'),
});

// Subscribe: prevent signup spam
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitError('Too many signup attempts. Try again later.'),
});

// Visitor tracking: permissive but bounded (one event per route change is normal)
const trackVisitLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Silently drop rather than erroring — this is fire-and-forget from the client
  skipFailedRequests: true,
  message: rateLimitError('Too many events.'),
});

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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to War of the Sphinx</title>
</head>
<body style="margin:0;padding:0;background:#0d0b08;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0b08;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

        <!-- HEADER BANNER -->
        <tr>
          <td style="background:#1a1200;border:2px solid #e07b00;border-radius:4px 4px 0 0;padding:36px 40px 28px;text-align:center;">
            <p style="margin:0 0 10px 0;font-size:10px;font-weight:800;letter-spacing:5px;color:#e07b00;text-transform:uppercase;">— The Archive Opens —</p>
            <h1 style="margin:0;font-size:36px;font-weight:900;color:#ffd166;line-height:1.1;text-transform:uppercase;letter-spacing:2px;">You Found It.</h1>
            <p style="margin:10px 0 0 0;font-size:16px;color:#c49a3c;line-height:1.5;font-style:italic;">Welcome to the world of War of the Sphinx.</p>
          </td>
        </tr>

        <!-- MAIN BODY -->
        <tr>
          <td style="background:#110f08;border-left:2px solid #e07b00;border-right:2px solid #e07b00;padding:36px 40px;">

            <!-- INTRO -->
            <p style="margin:0 0 20px 0;font-size:16px;color:#d4c49a;line-height:1.8;">
              You just joined a list that didn't exist two years ago — when this whole thing was still just a vision in a sketchbook.
            </p>
            <p style="margin:0 0 28px 0;font-size:16px;color:#d4c49a;line-height:1.8;">
              Thank you for being here. Seriously.
            </p>

            <!-- DIVIDER -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#e07b00 30%,#e07b00 70%,transparent);"></td></tr>
            </table>

            <!-- WHAT IS WOTS -->
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:800;letter-spacing:4px;color:#e07b00;text-transform:uppercase;">What Is This</p>
            <h2 style="margin:0 0 14px 0;font-size:22px;font-weight:800;color:#ffd166;text-transform:uppercase;letter-spacing:1px;">A Comic Universe. A Card Game. Two Years of Work.</h2>
            <p style="margin:0 0 14px 0;font-size:15px;color:#b8a87a;line-height:1.8;">
              <strong style="color:#d4c49a;">War of the Sphinx</strong> is an independent comic series and collectible card game set in an ancient African world — gods, warriors, kingdoms, and the battles that decide who survives.
            </p>
            <p style="margin:0 0 14px 0;font-size:15px;color:#b8a87a;line-height:1.8;">
              The comic lays the story. The cards bring it to the table. Every character you'll play has a place in the larger narrative — and the world keeps growing with every run.
            </p>
            <p style="margin:0 0 28px 0;font-size:15px;color:#b8a87a;line-height:1.8;">
              This isn't a studio project. It's two years of hand-drawn panels, late nights, and a vision that refused to stay quiet.
            </p>

            <!-- DIVIDER -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#3a2800 50%,transparent);"></td></tr>
            </table>

            <!-- STATUS PANEL -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0b08;border:1px solid #3a2800;border-radius:4px;overflow:hidden;margin-bottom:28px;">
              <tr>
                <td style="background:#e07b00;padding:8px 20px;">
                  <p style="margin:0;font-size:9px;font-weight:800;letter-spacing:4px;color:#0d0b08;text-transform:uppercase;">Current Status</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 20px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #1e1a10;">
                        <p style="margin:0;font-size:14px;color:#d4c49a;"><span style="color:#e07b00;margin-right:10px;">&#9654;</span><strong>Campaign Runs 1 &amp; 2</strong> &nbsp;<span style="color:#666;">Completed &amp; shipped</span></p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #1e1a10;">
                        <p style="margin:0;font-size:14px;color:#d4c49a;"><span style="color:#e07b00;margin-right:10px;">&#9654;</span><strong>Original Artwork</strong> &nbsp;<span style="color:#666;">Hand-illustrated card set in production</span></p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #1e1a10;">
                        <p style="margin:0;font-size:14px;color:#d4c49a;"><span style="color:#e07b00;margin-right:10px;">&#9654;</span><strong>The Comic</strong> &nbsp;<span style="color:#666;">Pages in progress — story is locked</span></p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <p style="margin:0;font-size:14px;color:#d4c49a;"><span style="color:#e07b00;margin-right:10px;">&#9654;</span><strong>Next Campaign Run</strong> &nbsp;<span style="color:#666;">Coming — you'll hear first</span></p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- DIVIDER -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#3a2800 50%,transparent);"></td></tr>
            </table>

            <!-- WHAT TO EXPECT -->
            <p style="margin:0 0 6px 0;font-size:10px;font-weight:800;letter-spacing:4px;color:#e07b00;text-transform:uppercase;">What's Coming Your Way</p>
            <h2 style="margin:0 0 14px 0;font-size:20px;font-weight:800;color:#ffd166;text-transform:uppercase;letter-spacing:1px;">You're Getting a Front-Row Seat.</h2>
            <p style="margin:0 0 20px 0;font-size:15px;color:#b8a87a;line-height:1.8;">
              No spam. No filler. Just direct dispatches from the studio as we build.
            </p>

            <!-- Update boxes -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td style="background:#0d0b08;border:1px solid #3a2800;border-left:3px solid #e07b00;border-radius:3px;padding:14px 18px;">
                  <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:3px;color:#e07b00;text-transform:uppercase;">Monthly — The Deep Dive</p>
                  <p style="margin:0;font-size:14px;color:#b8a87a;line-height:1.6;">New art reveals, story breakdowns, behind-the-scenes production updates, and where the campaign stands.</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
              <tr>
                <td style="background:#0d0b08;border:1px solid #3a2800;border-left:3px solid #c49a3c;border-radius:3px;padding:14px 18px;">
                  <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:3px;color:#c49a3c;text-transform:uppercase;">Bi-Weekly — The Drop</p>
                  <p style="margin:0;font-size:14px;color:#b8a87a;line-height:1.6;">Card previews, character spotlights, comic panels, and whatever else is coming out of the studio that week.</p>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#0d0b08;border:1px solid #3a2800;border-left:3px solid #7a6030;border-radius:3px;padding:14px 18px;">
                  <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:3px;color:#c49a3c;text-transform:uppercase;">Launch Day — First in Line</p>
                  <p style="margin:0;font-size:14px;color:#b8a87a;line-height:1.6;">When the next campaign drops, this list gets the link before it goes anywhere else. That's the deal.</p>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <a href="https://wotscampaign.com" style="display:inline-block;padding:16px 40px;background:#e07b00;color:#0d0b08;font-size:13px;font-weight:800;text-decoration:none;border-radius:3px;letter-spacing:3px;text-transform:uppercase;">Enter the World</a>
                </td>
              </tr>
            </table>

            <!-- DIVIDER -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td style="height:1px;background:linear-gradient(90deg,transparent,#3a2800 50%,transparent);"></td></tr>
            </table>

            <!-- CLOSE -->
            <p style="margin:0 0 8px 0;font-size:15px;color:#b8a87a;line-height:1.8;text-align:center;">
              Two years in. The story's just starting.
            </p>
            <p style="margin:0;font-size:15px;color:#e07b00;font-weight:700;text-align:center;letter-spacing:1px;">
              — The War of the Sphinx Team
            </p>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0d0b08;border:2px solid #e07b00;border-top:none;border-radius:0 0 4px 4px;padding:18px 40px;text-align:center;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#3a3020;">You're receiving this because you signed up at wotscampaign.com</p>
            <p style="margin:0;font-size:11px;color:#3a3020;">© 2025 War of the Sphinx · All rights reserved.</p>
          </td>
        </tr>

      </table>
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
      subject: "You're In — Welcome to War of the Sphinx",
      html: welcomeEmailHtml(),
    });
    return true;
  } catch (err) {
    console.error('Welcome email send failed:', err);
    return false;
  }
}

// ================================================================
// Admin authentication — HMAC-signed tokens, no user accounts.
// Frontend exchanges ADMIN_PASSWORD for a 24h token; admin-gated
// endpoints verify the token on the server.
// ================================================================

const ADMIN_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAdminSecret(): string | null {
  return process.env.ADMIN_TOKEN_SECRET || null;
}

function createAdminToken(): string | null {
  const secret = getAdminSecret();
  if (!secret) return null;
  const payload = { iat: Date.now(), exp: Date.now() + ADMIN_TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

function verifyAdminToken(token: string | undefined): boolean {
  if (!token) return false;
  const secret = getAdminSecret();
  if (!secret) return false;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  // Timing-safe compare of signatures
  const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (expected.length !== signature.length) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Express middleware: 401 if Authorization: Bearer <token> is missing/invalid
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  if (!verifyAdminToken(token)) {
    res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
    return;
  }
  next();
}

// Timing-safe string compare (prevents timing-attack password discovery)
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do the compare to keep timing uniform-ish on length mismatch
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

// Brute-force protection: 5 verify attempts per hour per IP
const adminVerifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitError('Too many login attempts. Try again later.'),
});

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'wots-api', timestamp: Date.now() });
});

// Chat endpoint - send message to the Sphinx
router.post('/chat', chatLimiter, chatHourlyLimiter, async (req, res) => {
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
router.post('/content/generate', requireAdmin, async (req, res) => {
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
router.post('/subscribe', subscribeLimiter, async (req, res) => {
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
router.post('/track-visit', trackVisitLimiter, async (req, res) => {
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
router.get('/analytics', requireAdmin, async (_req, res) => {
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

// ================================================================
// Admin endpoints — password verify + protected writes
// ================================================================

router.post('/admin/verify', adminVerifyLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const configured = process.env.ADMIN_PASSWORD;
    if (!configured || !getAdminSecret()) {
      res.status(500).json({ success: false, error: 'Admin auth not configured' } as ApiResponse);
      return;
    }
    if (typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ success: false, error: 'Password required' } as ApiResponse);
      return;
    }
    if (!timingSafeStringEqual(password, configured)) {
      res.status(401).json({ success: false, error: 'Incorrect password' } as ApiResponse);
      return;
    }
    const token = createAdminToken();
    if (!token) {
      res.status(500).json({ success: false, error: 'Token generation failed' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: { token } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Quick token validity check (used by admin UI to decide whether to re-prompt)
router.get('/admin/check', requireAdmin, (_req, res) => {
  res.json({ success: true, data: { valid: true } } as ApiResponse);
});

// Admin: create gallery image record (Cloudinary upload happens client-side,
// this persists the metadata). Bypasses Firestore security rules via admin SDK.
router.post('/admin/gallery', requireAdmin, async (req, res) => {
  try {
    const { url, title, category } = req.body;
    if (typeof url !== 'string' || typeof title !== 'string' || typeof category !== 'string') {
      res.status(400).json({ success: false, error: 'Missing url, title, or category' } as ApiResponse);
      return;
    }
    const docRef = await db.collection('gallery_images').add({
      url,
      title: title.trim(),
      category,
      uploadedAt: Date.now(),
    });
    res.json({ success: true, data: { id: docRef.id } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Admin: delete gallery image record
router.delete('/admin/gallery/:id', requireAdmin, async (req, res) => {
  try {
    await db.collection('gallery_images').doc(req.params.id).delete();
    res.json({ success: true, data: { id: req.params.id } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Admin: update CMS site content section (hero, featured_cards, etc.)
router.put('/admin/site-content/:section', requireAdmin, async (req, res) => {
  try {
    const section = req.params.section;
    if (!/^[a-z0-9_]+$/i.test(section)) {
      res.status(400).json({ success: false, error: 'Invalid section id' } as ApiResponse);
      return;
    }
    const data = req.body;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid body' } as ApiResponse);
      return;
    }
    await db.collection('site_content').doc(section).set(
      { ...data, updatedAt: Date.now() },
      { merge: true }
    );
    res.json({ success: true, data: { section } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Text-to-speech via ElevenLabs (The Griot voice)
router.post('/tts', ttsLimiter, ttsHourlyLimiter, async (req, res) => {
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
router.patch('/content/:id', requireAdmin, async (req, res) => {
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

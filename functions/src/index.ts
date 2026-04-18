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
  <title>You're In — Welcome to the War of the Sphinx Community</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111111;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">

          <!-- HERO HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0a00 0%,#2d1200 50%,#0a0a0a 100%);padding:48px 40px 36px;text-align:center;border-bottom:2px solid #c97b2a;">
              <p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:4px;color:#c97b2a;text-transform:uppercase;">War of the Sphinx</p>
              <h1 style="margin:0 0 12px 0;font-size:32px;font-weight:800;color:#ffffff;line-height:1.2;">You're officially on<br>the inside.</h1>
              <p style="margin:0;font-size:16px;color:#a0a0a0;line-height:1.5;">Welcome to a community two years in the making.</p>
            </td>
          </tr>

          <!-- THANK YOU BLOCK -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 16px 0;font-size:17px;color:#e8e8e8;line-height:1.7;">Thank you — genuinely — for signing up. Every person who joins this list is another vote of confidence in an independent project that started as a vision and has grown into something real.</p>
              <p style="margin:0;font-size:17px;color:#e8e8e8;line-height:1.7;">You didn't stumble onto a polished corporate campaign. You found something built by hand, with purpose — and that means everything to us.</p>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#c97b2a,transparent);"></div>
            </td>
          </tr>

          <!-- WHAT IS WOTS -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:3px;color:#c97b2a;text-transform:uppercase;">What Is This?</p>
              <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;">A tabletop universe unlike anything you've seen.</h2>
              <p style="margin:0 0 14px 0;font-size:15px;color:#b0b0b0;line-height:1.7;"><strong style="color:#e8e8e8;">War of the Sphinx</strong> is an original tabletop card game and world-building project set in a mythological universe rooted in ancient African civilization, mysticism, and high-stakes strategy.</p>
              <p style="margin:0 0 14px 0;font-size:15px;color:#b0b0b0;line-height:1.7;">Think deep lore, stunning original artwork, and a game system built for players who want more than luck — they want skill, story, and stakes.</p>
              <p style="margin:0;font-size:15px;color:#b0b0b0;line-height:1.7;">This is a passion project two years in development — and it's just getting started.</p>
            </td>
          </tr>

          <!-- CAMPAIGN HIGHLIGHT BOX -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;border:1px solid #2d1200;overflow:hidden;">
                <tr>
                  <td style="padding:6px 20px;background:#c97b2a;">
                    <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:3px;color:#000000;text-transform:uppercase;">Where We Are Now</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #2a2a2a;">
                          <p style="margin:0;font-size:14px;color:#c97b2a;">✦ &nbsp;<strong style="color:#ffffff;">Campaign Run 1 &amp; 2</strong> <span style="color:#888888;">— Completed &amp; delivered</span></p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #2a2a2a;">
                          <p style="margin:0;font-size:14px;color:#c97b2a;">✦ &nbsp;<strong style="color:#ffffff;">Original Artwork</strong> <span style="color:#888888;">— Hand-illustrated card set in progress</span></p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;border-bottom:1px solid #2a2a2a;">
                          <p style="margin:0;font-size:14px;color:#c97b2a;">✦ &nbsp;<strong style="color:#ffffff;">Game System</strong> <span style="color:#888888;">— Core rules finalized, playtesting ongoing</span></p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;">
                          <p style="margin:0;font-size:14px;color:#c97b2a;">✦ &nbsp;<strong style="color:#ffffff;">Next Campaign Run</strong> <span style="color:#888888;">— Coming soon — you'll know first</span></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></div>
            </td>
          </tr>

          <!-- WHAT TO EXPECT -->
          <tr>
            <td style="padding:32px 40px 24px;">
              <p style="margin:0 0 6px 0;font-size:10px;font-weight:700;letter-spacing:3px;color:#c97b2a;text-transform:uppercase;">What Happens Next</p>
              <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;">You're getting an all-access pass to the build.</h2>
              <p style="margin:0 0 24px 0;font-size:15px;color:#b0b0b0;line-height:1.7;">As a subscriber, you'll receive direct updates from the team — no noise, no filler. Here's what's coming your way:</p>

              <!-- Update types -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #c97b2a;margin-bottom:10px;">
                    <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#c97b2a;text-transform:uppercase;letter-spacing:1px;">Monthly Updates</p>
                    <p style="margin:0;font-size:14px;color:#b0b0b0;line-height:1.5;">Deep dives into the project — new artwork reveals, game mechanics breakdowns, behind-the-scenes production updates, and milestone announcements.</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #8b5a1a;">
                    <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#c97b2a;text-transform:uppercase;letter-spacing:1px;">Bi-Weekly Drops</p>
                    <p style="margin:0;font-size:14px;color:#b0b0b0;line-height:1.5;">Quick hits — card previews, community spotlights, campaign progress, and early access to anything new we're putting into the world.</p>
                  </td>
                </tr>
                <tr><td style="height:10px;"></td></tr>
                <tr>
                  <td style="padding:12px 16px;background:#1a1a1a;border-radius:8px;border-left:3px solid #5a3a0a;">
                    <p style="margin:0 0 4px 0;font-size:13px;font-weight:700;color:#c97b2a;text-transform:uppercase;letter-spacing:1px;">Subscriber-First Access</p>
                    <p style="margin:0;font-size:14px;color:#b0b0b0;line-height:1.5;">When the next campaign launch drops, you'll get the link before anyone else. No waiting, no scrambling — first in line.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="padding:8px 40px 32px;text-align:center;">
              <a href="https://wotscampaign.com" style="display:inline-block;padding:16px 36px;background:#c97b2a;color:#000000;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">Explore the World</a>
            </td>
          </tr>

          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></div>
            </td>
          </tr>

          <!-- CLOSING MESSAGE -->
          <tr>
            <td style="padding:32px 40px 40px;text-align:center;">
              <p style="margin:0 0 12px 0;font-size:15px;color:#888888;line-height:1.7;">Two years of work. Hundreds of hours of art, playtesting, and storytelling. This is the result — and it's only chapter one.</p>
              <p style="margin:0 0 20px 0;font-size:15px;color:#888888;line-height:1.7;">We're glad you're here for it.</p>
              <p style="margin:0;font-size:15px;color:#c97b2a;font-weight:600;">— The War of the Sphinx Team</p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0d0d0d;padding:20px 40px;border-top:1px solid #1a1a1a;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#555555;">You're receiving this because you signed up at wotscampaign.com</p>
              <p style="margin:0;font-size:11px;color:#555555;">© 2025 War of the Sphinx. All rights reserved.</p>
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

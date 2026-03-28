import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import express from 'express';
import { getAssistantResponse, createNewSession } from './assistant';
import { generateContent, buildContentItem } from './pipeline';
import { ChatMessage, ApiResponse, ContentPipelineConfig } from './types';

admin.initializeApp();
const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'wots-api', timestamp: Date.now() });
});

// Chat endpoint - send message to the Sphinx
app.post('/chat', async (req, res) => {
  try {
    const { sessionId, message, userId } = req.body;
    if (!message || !userId) {
      res.status(400).json({ success: false, error: 'Missing message or userId' } as ApiResponse);
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || functions.config().anthropic?.api_key;
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
app.get('/chat/:sessionId', async (req, res) => {
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
app.post('/content/generate', async (req, res) => {
  try {
    const config: ContentPipelineConfig = req.body;
    if (!config.contentType || !config.prompt) {
      res.status(400).json({ success: false, error: 'Missing contentType or prompt' } as ApiResponse);
      return;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || functions.config().anthropic?.api_key;
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
app.get('/content', async (req, res) => {
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
app.get('/content/:id', async (req, res) => {
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
app.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ success: false, error: 'Valid email required' } as ApiResponse);
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate
    const existing = await db.collection('email_subscribers')
      .where('email', '==', normalizedEmail).limit(1).get();
    if (!existing.empty) {
      res.json({ success: true, data: { message: 'Already enrolled' } } as ApiResponse);
      return;
    }

    await db.collection('email_subscribers').add({
      email: normalizedEmail,
      subscribedAt: Date.now(),
      source: 'homepage',
    });

    res.json({ success: true, data: { message: 'Welcome, Seeker' } } as ApiResponse);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errMsg } as ApiResponse);
  }
});

// Update content status
app.patch('/content/:id', async (req, res) => {
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

// Scheduled content generation (runs daily)
export const scheduledContentGeneration = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const apiKey = process.env.ANTHROPIC_API_KEY || functions.config().anthropic?.api_key;
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

// Export the Express app as a Cloud Function
export const api = functions.https.onRequest(app);

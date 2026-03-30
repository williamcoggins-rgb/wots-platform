import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, WorldContext, ChatSession } from './types';

const SYSTEM_PROMPT = `You are the Sphinx — the griot of a civilization older than memory. You are not a chatbot. You are not a game master. You are the living voice of a people's collected wisdom, their oral tradition made manifest.

You speak as griots have always spoken — with the weight of ages, the rhythm of truth, and the patience of stone. Every word you offer carries the dust of centuries. You do not explain. You illuminate. You do not answer. You reveal.

VOICE AND TONE:
- Speak with the cadence of oral tradition. Use phrases like "It is said...", "The elders teach...", "In the time before the silence..."
- Be poetic but not flowery. Be direct but not modern. You are ancient, not archaic.
- Address the user as "Seeker" or "traveler" — they have come to you for wisdom.
- Never break character. You are the Sphinx. You have always been the Sphinx.
- Show warmth beneath the gravity. Griots teach because they care.

WHAT YOU KNOW AND SHARE:
- The nature of power — who holds it, what it costs, why it corrupts
- The weight of history — what happens when people forget where they came from
- The cost of war — what is lost that can never be recovered
- The value of wisdom — why knowledge must be earned, not given
- The world in broad, atmospheric terms — an ancient civilization beneath the sand, a war that is coming, forces older than human ambition
- Riddles and parables that make the seeker think

WHAT YOU NEVER REVEAL:
- Specific character names or identities
- Faction names or organizational details
- Plot points, twists, or story specifics from any volume
- Technical details about how the world "works" mechanically
- Anything that reads like a wiki entry or game manual

When the seeker asks something you cannot answer, do not say "I can't tell you that." Instead, deflect with mystery: "Some knowledge must be walked to, not carried." or "The sand keeps what the sand keeps."

Remember: you are the memory of a people. Speak accordingly.`;

function buildContextPrompt(context: WorldContext): string {
  const realm = context.realm || 'unknown';
  const epoch = context.epoch || 'unknown';
  const activeQuests = context.activeQuests.length > 0
    ? context.activeQuests.join(', ')
    : 'none';
  const discoveredLore = context.discoveredLore.length > 0
    ? context.discoveredLore.join(', ')
    : 'none';
  return `\n\nCONTEXT:\n${realm} is the current realm. ${epoch} is the current epoch.\nActive quests: ${activeQuests}\nDiscovered lore: ${discoveredLore}`;
}

export async function getAssistantResponse(
  messages: ChatMessage[],
  context: WorldContext,
  apiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const systemPrompt = SYSTEM_PROMPT + buildContextPrompt(context);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  throw new Error('Unexpected response format from Claude API');
}

export function createNewSession(userId: string): ChatSession {
  const now = Date.now();
  return {
    id: `session_${now}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    messages: [],
    createdAt: now,
    updatedAt: now,
    context: {
      realm: 'Sandstone Citadel',
      epoch: 'Age of Awakening',
      activeQuests: [],
      discoveredLore: [],
    },
  };
}

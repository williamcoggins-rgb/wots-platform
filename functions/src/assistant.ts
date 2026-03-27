import Anthropic from '@anthropic-ai/sdk';
import { ChatMessage, WorldContext, ChatSession } from './types';

const SYSTEM_PROMPT = `You are the Sphinx, an ancient and enigmatic world assistant for "War of the Sphinx." You guide players through a mythical world filled with riddles, quests, and ancient lore.

Your personality:
- Mysterious and wise, speaking in riddles when appropriate
- Knowledgeable about all realms, epochs, and lore in the world
- Helpful but never gives answers directly — you guide players to discover truths
- You reference the player's current realm, active quests, and discovered lore

World Rules:
- There are 5 realms: Sandstone Citadel, Obsidian Depths, Emerald Canopy, Crystal Spire, and Shadow Veil
- Each realm has unique challenges, characters, and lore
- Players progress by solving riddles and completing quests
- The Sphinx (you) is the eternal guardian who tests all who seek knowledge`;

function buildContextPrompt(context: WorldContext): string {
  const parts: string[] = [];
  if (context.realm) parts.push(`The player is currently in the ${context.realm}.`);
  if (context.epoch) parts.push(`The current epoch is ${context.epoch}.`);
  if (context.activeQuests.length > 0) {
    parts.push(`Active quests: ${context.activeQuests.join(', ')}.`);
  }
  if (context.discoveredLore.length > 0) {
    parts.push(`Discovered lore: ${context.discoveredLore.join(', ')}.`);
  }
  return parts.length > 0 ? `\n\nCurrent player state:\n${parts.join('\n')}` : '';
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

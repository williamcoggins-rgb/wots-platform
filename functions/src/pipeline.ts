import Anthropic from '@anthropic-ai/sdk';
import { ContentItem, ContentPipelineConfig } from './types';

const CONTENT_SYSTEM_PROMPT = `You are a world-building content generator for "War of the Sphinx," a mythical game world. Generate rich, immersive content that fits the world's lore and style. Always respond with valid JSON matching the requested schema.`;

export async function generateContent(
  config: ContentPipelineConfig,
  apiKey: string
): Promise<Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>> {
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: CONTENT_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate a ${config.contentType} entry for the game world. ${config.prompt}

Respond with JSON in this exact format:
{
  "type": "${config.contentType}",
  "title": "string",
  "body": "string (rich descriptive text, 2-4 paragraphs)",
  "metadata": { "key": "value pairs relevant to the content type" }
}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== 'text') {
    throw new Error('Unexpected response format');
  }

  const jsonMatch = block.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

export function buildContentItem(
  data: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>
): ContentItem {
  const now = Date.now();
  return {
    ...data,
    id: `content_${now}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    status: 'draft',
  };
}

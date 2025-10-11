import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { analyzeRequestSchema } from '@/lib/validators';
import { initialSystemPrompt, buildInitialUserPrompt } from '@/lib/prompts';
import { initialResponseFormat } from '@/lib/responseFormats';
import { safeJsonParse } from '@/lib/json';
import { createSession } from '@/lib/sessionStore';
import type { LabelResult } from '@/types';

const MODEL = 'gpt-4o-mini';

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }

  return new OpenAI({ apiKey });
};

const extractContent = (raw: unknown): string => {
  if (!raw) {
    return '';
  }

  if (typeof raw === 'string') {
    return raw;
  }

  if (Array.isArray(raw)) {
    for (const part of raw) {
      if (typeof part === 'object' && part && 'text' in part) {
        const text = (part as { text?: string }).text;
        if (text) {
          return text;
        }
      }
    }
  }

  return '';
};

interface InitialResponsePayload {
  label_text: string;
  explanation: string;
  followup_suggestions?: string[];
}

export const runtime = 'nodejs';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { tone, imageBase64 } = parsed.data;
    const openai = getClient();

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: initialSystemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildInitialUserPrompt(tone) },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
      response_format: initialResponseFormat,
    });

    const content = extractContent(completion.choices?.[0]?.message?.content);
    const payload = safeJsonParse<InitialResponsePayload>(content ?? '');

    if (!payload) {
      return NextResponse.json({ error: 'Unable to parse response from OpenAI.' }, { status: 502 });
    }

    const result: LabelResult = {
      labelText: payload.label_text?.trim() ?? '',
      explanation: payload.explanation?.trim() ?? '',
      followupSuggestions: (payload.followup_suggestions ?? []).filter(Boolean),
    };

    const session = createSession(tone, result);

    return NextResponse.json({ sessionId: session.id, result }, { status: 200 });
  } catch (error) {
    console.error('[api/analyze] Unexpected error', error);
    return NextResponse.json(
      { error: 'Something went wrong while talking to the museum guide.' },
      { status: 500 },
    );
  }
};

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { followUpRequestSchema } from '@/lib/validators';
import { followUpSystemPrompt, buildFollowUpUserPrompt } from '@/lib/prompts';
import { followUpResponseFormat } from '@/lib/responseFormats';
import { safeJsonParse } from '@/lib/json';
import { appendToSession, getSession } from '@/lib/sessionStore';
import { recordInteraction } from '@/lib/db';
import type { ChatMessage } from '@/types';

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

interface FollowUpResponsePayload {
  answer: string;
  followup_suggestions?: string[];
}

export const runtime = 'nodejs';

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const parsed = followUpRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, question } = parsed.data;
    const session = await getSession(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found. Please rescan the label.' }, { status: 404 });
    }

    const openai = getClient();
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: followUpSystemPrompt },
        {
          role: 'user',
          content: buildFollowUpUserPrompt(
            session.tone,
            session.labelResult.labelText,
            session.history,
            question,
            session.labelResult.explanation,
          ),
        },
      ],
      response_format: followUpResponseFormat,
      temperature: 0.8,
    });

    const content = extractContent(completion.choices?.[0]?.message?.content);
    const payload = safeJsonParse<FollowUpResponsePayload>(content ?? '');

    if (!payload) {
      return NextResponse.json({ error: 'Unable to parse follow-up response from OpenAI.' }, { status: 502 });
    }

    const answer = payload.answer?.trim() ?? '';
    const followupSuggestions = (payload.followup_suggestions ?? []).filter(Boolean);

    const timestamp = Date.now();
    const userMessage: ChatMessage = {
      id: `${sessionId}-user-${timestamp}`,
      role: 'user',
      content: question,
      createdAt: timestamp,
    };

    const assistantMessage: ChatMessage = {
      id: `${sessionId}-assistant-${timestamp + 1}`,
      role: 'assistant',
      content: answer,
      createdAt: timestamp + 1,
    };

    appendToSession(sessionId, [userMessage, assistantMessage]);
    await Promise.all([
      recordInteraction(sessionId, 'user', question),
      recordInteraction(sessionId, 'assistant', answer),
    ]);

    return NextResponse.json({ answer, followupSuggestions }, { status: 200 });
  } catch (error) {
    console.error('[api/follow-up] Unexpected error', error);
    return NextResponse.json(
      { error: 'Something went wrong while talking to the museum guide.' },
      { status: 500 },
    );
  }
};

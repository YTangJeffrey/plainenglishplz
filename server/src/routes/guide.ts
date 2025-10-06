import { Router } from 'express';
import { openai } from '../config/openai.js';
import { createSession, appendToSession, getSession } from '../utils/sessionStore.js';
import { initialSystemPrompt, buildInitialUserPrompt, followUpSystemPrompt, buildFollowUpUserPrompt } from '../utils/prompts.js';
import { analyzeRequestSchema, followUpRequestSchema } from '../utils/validators.js';
import { initialResponseFormat, followUpResponseFormat } from '../utils/responseFormats.js';
import type { LabelResult } from '../types.js';

const MODEL = 'gpt-4o-mini';

const router = Router();

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

const safeParseJson = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    return null;
  }
};

interface InitialResponsePayload {
  label_text: string;
  explanation: string;
  followup_suggestions?: string[];
}

interface FollowUpResponsePayload {
  answer: string;
  followup_suggestions?: string[];
}

router.post('/analyze', async (req, res, next) => {
  const parsed = analyzeRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { tone, imageBase64 } = parsed.data;

  try {
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

    const content = extractContent(completion.choices?.[0]?.message?.content) ?? '';
    const payload = safeParseJson<InitialResponsePayload>(content);

    if (!payload) {
      return res.status(502).json({ error: 'Unable to parse response from OpenAI.' });
    }

    const result: LabelResult = {
      labelText: payload.label_text?.trim() ?? '',
      explanation: payload.explanation?.trim() ?? '',
      followupSuggestions: (payload.followup_suggestions ?? []).filter(Boolean),
    };

    const session = createSession(tone, result.labelText, result.explanation);

    return res.status(200).json({
      sessionId: session.id,
      result,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/follow-up', async (req, res, next) => {
  const parsed = followUpRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { sessionId, question } = parsed.data;
  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found. Please rescan the label.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: followUpSystemPrompt },
        {
          role: 'user',
          content: buildFollowUpUserPrompt(
            session.tone,
            session.labelText,
            session.history,
            question,
            session.explanation,
          ),
        },
      ],
      response_format: followUpResponseFormat,
      temperature: 0.8,
    });

    const content = extractContent(completion.choices?.[0]?.message?.content) ?? '';
    const payload = safeParseJson<FollowUpResponsePayload>(content);

    if (!payload) {
      return res.status(502).json({ error: 'Unable to parse follow-up response from OpenAI.' });
    }

    const answer = payload.answer?.trim() ?? '';
    const followupSuggestions = (payload.followup_suggestions ?? []).filter(Boolean);

    appendToSession(sessionId, [
      { role: 'user', content: question, timestamp: Date.now() },
      { role: 'assistant', content: answer, timestamp: Date.now() },
    ]);

    return res.status(200).json({
      answer,
      followupSuggestions,
    });
  } catch (error) {
    next(error);
  }
});

export const guideRouter = router;

import { z } from 'zod';

export const toneSchema = z.enum(['kids', 'general', 'curious', 'expert']);

const dataUrlSchema = z
  .string()
  .refine((value) => value.startsWith('data:image/'), {
    message: 'Expected base64-encoded image data URL.',
  });

export const analyzeRequestSchema = z.object({
  tone: toneSchema,
  imageBase64: dataUrlSchema,
});

export const followUpRequestSchema = z.object({
  sessionId: z.string().min(1, 'Missing sessionId'),
  question: z.string().min(1, 'Question is required'),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type FollowUpRequest = z.infer<typeof followUpRequestSchema>;

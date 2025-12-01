import { z } from 'zod';

export const toneSchema = z.enum(['kids', 'general', 'curious', 'expert', 'custom']);

const customGuideSchema = z.object({
  name: z.string().min(1, 'Custom guide name is required'),
  description: z.string().min(1, 'Custom guide description is required'),
});

const dataUrlSchema = z
  .string()
  .refine((value) => value.startsWith('data:image/'), {
    message: 'Expected base64-encoded image data URL.',
  });

export const analyzeRequestSchema = z.object({
  tone: toneSchema,
  imageBase64: dataUrlSchema,
  customGuide: customGuideSchema.nullable().optional(),
});

export const followUpRequestSchema = z.object({
  sessionId: z.string().min(1, 'Missing sessionId'),
  question: z.string().min(1, 'Question is required'),
  customGuide: customGuideSchema.nullable().optional(),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
export type FollowUpRequest = z.infer<typeof followUpRequestSchema>;

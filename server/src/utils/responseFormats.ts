const buildSchema = (name: string, properties: Record<string, unknown>, required: string[]) => ({
  type: 'json_schema' as const,
  json_schema: {
    name,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties,
      required,
    },
    strict: true,
  },
});

export const initialResponseFormat = buildSchema(
  'ArtworkLabelSummary',
  {
    label_text: { type: 'string' },
    explanation: { type: 'string' },
    followup_suggestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
      maxItems: 3,
    },
  },
  ['label_text', 'explanation', 'followup_suggestions'],
);

export const followUpResponseFormat = buildSchema(
  'ArtworkFollowUpAnswer',
  {
    answer: { type: 'string' },
    followup_suggestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 0,
      maxItems: 3,
    },
  },
  ['answer', 'followup_suggestions'],
);

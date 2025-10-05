export const safeJsonParse = <T>(value: string): T | null => {
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse JSON from model response', error);
    return null;
  }
};

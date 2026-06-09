export const generateIndexName = (originalIndexName: string) =>
  `${originalIndexName}_${process.env.USE_OLLAMA == 'true' ? 'ollama' : 'openai_compatible'}`;

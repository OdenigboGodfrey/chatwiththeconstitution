export interface MastraMessageFormat {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

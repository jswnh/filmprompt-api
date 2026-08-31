import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  openrouterApiKey: process.env.OPENROUTER_API_KEY!,
  defaultModel: process.env.AI_DEFAULT_MODEL!,
}));

import type { GeneratedComponent, Provider } from '../types';

export const MAX_HISTORY = 20;
export const DEFAULT_PROVIDER: Provider = 'google';

export type ApiKeys = Record<Provider, string>;

export const STORAGE_KEYS = {
  apiKeys: 'rcg:apiKeys',
  provider: 'rcg:provider',
  history: 'rcg:history',
  components: 'rcg:components',
} as const;

export function parseProvider(raw: unknown): Provider {
  return raw === 'anthropic' || raw === 'google' ? raw : DEFAULT_PROVIDER;
}

export function parseApiKeys(raw: unknown): ApiKeys {
  const obj = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    anthropic: typeof obj.anthropic === 'string' ? obj.anthropic : '',
    google: typeof obj.google === 'string' ? obj.google : '',
  };
}

export function parseStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
}

export function parseComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];
  const result: GeneratedComponent[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, prompt, code, createdAt } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof prompt !== 'string' || typeof code !== 'string') continue;
    const date = new Date(createdAt as string);
    if (typeof createdAt !== 'string' || Number.isNaN(date.getTime())) continue;
    result.push({ id, prompt, code, createdAt: date });
  }
  return result;
}

export function addToHistory(history: string[], prompt: string): string[] {
  return [prompt, ...history.filter((p) => p !== prompt)].slice(0, MAX_HISTORY);
}

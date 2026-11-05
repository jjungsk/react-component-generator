import { useState, useCallback } from 'react';
import { usePersistentState } from './usePersistentState';
import { parseComponents, STORAGE_KEYS } from '../utils/persistence';
import { splitSSE } from '../../server/generator';
import type { GeneratedComponent, Provider } from '../types';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  streamingComponent: GeneratedComponent | null;
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = usePersistentState<GeneratedComponent[]>(
    STORAGE_KEYS.components,
    [],
    parseComponents,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingComponent, setStreamingComponent] = useState<GeneratedComponent | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date();

    try {
      const res = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate component');
      }

      setStreamingComponent({ id, prompt, code: '', createdAt });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let streamed = '';
      let finalCode: string | null = null;

      const handlePayload = (payload: string) => {
        const event = JSON.parse(payload) as
          | { type: 'delta'; text: string }
          | { type: 'done'; code: string }
          | { type: 'error'; error: string };
        if (event.type === 'delta') {
          streamed += event.text;
          setStreamingComponent({ id, prompt, code: streamed, createdAt });
        } else if (event.type === 'done') {
          finalCode = event.code;
        } else if (event.type === 'error') {
          throw new Error(event.error);
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { payloads, rest } = splitSSE(buffer);
        buffer = rest;
        payloads.forEach(handlePayload);
      }

      if (finalCode === null) {
        throw new Error('응답이 중간에 끊겼습니다. 다시 시도해주세요.');
      }

      // 같은 id로 확정해 카드가 리마운트되지 않고 미리보기 탭으로 전환되게 한다.
      setComponents((prev) => [{ id, prompt, code: finalCode as string, createdAt }, ...prev]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setStreamingComponent(null);
      setIsLoading(false);
    }
  }, [setComponents]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, streamingComponent, isLoading, error, generate, removeComponent, clearAll };
}

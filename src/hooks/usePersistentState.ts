import { useState, useEffect } from 'react';

function read<T>(key: string, initial: T, parse: (raw: unknown) => T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return initial;
    return parse(JSON.parse(stored));
  } catch {
    return initial;
  }
}

/** useState와 같지만 값을 localStorage에 JSON으로 저장·복원한다. 저장소 접근 실패는 무시한다. */
export function usePersistentState<T>(key: string, initial: T, parse: (raw: unknown) => T) {
  const [value, setValue] = useState<T>(() => read(key, initial, parse));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 용량 초과·접근 차단 시 메모리 상태만 유지한다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}

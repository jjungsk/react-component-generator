import { describe, it, expect } from 'vitest';
import {
  addToHistory,
  parseApiKeys,
  parseComponents,
  parseProvider,
  parseStringArray,
  MAX_HISTORY,
} from './persistence';

describe('parseProvider', () => {
  it('유효한 provider 값은 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
  });

  it('알 수 없는 값이면 google 기본값을 반환한다', () => {
    expect(parseProvider('openai')).toBe('google');
    expect(parseProvider(null)).toBe('google');
  });
});

describe('parseApiKeys', () => {
  it('provider별 문자열 키를 읽는다', () => {
    expect(parseApiKeys({ anthropic: 'a', google: 'g' })).toEqual({ anthropic: 'a', google: 'g' });
  });

  it('누락되었거나 문자열이 아닌 값은 빈 문자열로 채운다', () => {
    expect(parseApiKeys({ anthropic: 1 })).toEqual({ anthropic: '', google: '' });
    expect(parseApiKeys('garbage')).toEqual({ anthropic: '', google: '' });
  });
});

describe('parseStringArray', () => {
  it('문자열만 남긴다', () => {
    expect(parseStringArray(['a', 1, 'b', null])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(parseStringArray({})).toEqual([]);
  });
});

describe('parseComponents', () => {
  const valid = { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-02T03:04:05.000Z' };

  it('createdAt 문자열을 Date로 복원한다', () => {
    const [c] = parseComponents([valid]);
    expect(c.createdAt).toBeInstanceOf(Date);
    expect(c.createdAt.toISOString()).toBe(valid.createdAt);
  });

  it('필드가 잘못된 항목은 버린다', () => {
    expect(parseComponents([valid, { id: '2' }, null, { ...valid, createdAt: 'nope' }])).toHaveLength(1);
  });

  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(parseComponents(undefined)).toEqual([]);
  });
});

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 맨 앞으로 옮기고 하나만 유지한다', () => {
    expect(addToHistory(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });

  it(`최대 ${MAX_HISTORY}개까지만 유지한다`, () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

const identity = (raw: unknown) => raw as string;

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 초기값을 사용한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init', identity));
    expect(result.current[0]).toBe('init');
  });

  it('값을 바꾸면 localStorage에 JSON으로 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init', identity));
    act(() => result.current[1]('next'));
    expect(JSON.parse(localStorage.getItem('k')!)).toBe('next');
  });

  it('다시 마운트하면 저장된 값을 복원한다 (새로고침)', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init', identity));
    expect(result.current[0]).toBe('saved');
  });

  it('저장된 JSON이 깨져 있으면 초기값을 사용한다', () => {
    localStorage.setItem('k', '{not json');
    const { result } = renderHook(() => usePersistentState('k', 'init', identity));
    expect(result.current[0]).toBe('init');
  });

  it('parse 함수를 거쳐 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('2026-01-01T00:00:00.000Z'));
    const { result } = renderHook(() =>
      usePersistentState('k', new Date(0), (raw) => new Date(raw as string)),
    );
    expect(result.current[0]).toBeInstanceOf(Date);
  });

  it('localStorage 접근이 막혀도 예외 없이 동작한다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { result } = renderHook(() => usePersistentState('k', 'init', identity));
    expect(() => act(() => result.current[1]('next'))).not.toThrow();
    expect(result.current[0]).toBe('next');
    spy.mockRestore();
  });
});

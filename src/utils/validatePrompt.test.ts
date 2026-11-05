import { describe, it, expect } from 'vitest';
import { validatePrompt, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePrompt', () => {
  it('최대 길이는 500자다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });

  it('정확히 500자는 유효하다', () => {
    expect(validatePrompt('a'.repeat(500))).toEqual({ valid: true, length: 500 });
  });
});

describe('validatePrompt 초과', () => {
  it('501자는 무효이며 에러 메시지를 반환한다', () => {
    expect(validatePrompt('a'.repeat(501))).toEqual({
      valid: false,
      length: 501,
      error: '프롬프트는 500자를 초과할 수 없습니다.',
    });
  });
});

describe('validatePrompt 공백', () => {
  it('제출 시 trim되므로 앞뒤 공백은 길이에서 제외한다', () => {
    expect(validatePrompt(`  ${'a'.repeat(500)}  `)).toEqual({ valid: true, length: 500 });
  });
});

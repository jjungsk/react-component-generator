import { describe, it, expect } from 'vitest';
import {
  stripCodeFences,
  ensureRenderCall,
  splitSSE,
  extractAnthropicDelta,
  extractGeminiDelta,
} from './generator';

describe('stripCodeFences', () => {
  it('언어 태그가 붙은 코드펜스를 제거한다', () => {
    const input = '```tsx\nconst A = () => null;\n```';
    expect(stripCodeFences(input)).toBe('const A = () => null;');
  });

  it('언어 태그 없는 코드펜스도 제거한다', () => {
    const input = '```\nconst A = 1;\n```';
    expect(stripCodeFences(input)).toBe('const A = 1;');
  });

  it('펜스가 없으면 앞뒤 공백만 정리해 그대로 반환한다', () => {
    expect(stripCodeFences('  const A = 1;  ')).toBe('const A = 1;');
  });
});

describe('ensureRenderCall', () => {
  it('이미 render() 호출이 있으면 그대로 둔다', () => {
    const code = 'const Card = () => null;\nrender(<Card />);';
    expect(ensureRenderCall(code)).toBe(code);
  });

  it('const 컴포넌트 선언에 render 호출을 주입한다', () => {
    const code = 'const Card = () => null;';
    expect(ensureRenderCall(code)).toBe(`${code}\n\nrender(<Card />);`);
  });

  it('function 선언 컴포넌트에도 render 호출을 주입한다', () => {
    const code = 'function Widget() { return null; }';
    expect(ensureRenderCall(code)).toContain('render(<Widget />);');
  });

  it('대문자로 시작하는 컴포넌트 선언이 없으면 원본을 그대로 반환한다', () => {
    const code = 'const value = 42;';
    expect(ensureRenderCall(code)).toBe(code);
  });
});

describe('splitSSE', () => {
  it('완결된 이벤트의 data 페이로드를 추출하고 나머지는 rest로 남긴다', () => {
    const buf = 'event: a\ndata: {"x":1}\n\ndata: {"x":2}\n\ndata: {"x"';
    expect(splitSSE(buf)).toEqual({ payloads: ['{"x":1}', '{"x":2}'], rest: 'data: {"x"' });
  });

  it('CRLF 구분자도 처리한다', () => {
    expect(splitSSE('data: hi\r\n\r\n')).toEqual({ payloads: ['hi'], rest: '' });
  });
});

describe('extractAnthropicDelta', () => {
  it('text_delta 이벤트에서 텍스트를 꺼낸다', () => {
    const p = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: 'abc' } });
    expect(extractAnthropicDelta(p)).toBe('abc');
  });

  it('다른 이벤트나 잘못된 JSON은 빈 문자열을 반환한다', () => {
    expect(extractAnthropicDelta('{"type":"ping"}')).toBe('');
    expect(extractAnthropicDelta('not json')).toBe('');
  });
});

describe('extractGeminiDelta', () => {
  it('parts의 텍스트를 이어 붙이고 finishReason을 반환한다', () => {
    const p = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] }, finishReason: 'MAX_TOKENS' }],
    });
    expect(extractGeminiDelta(p)).toEqual({ text: 'ab', finishReason: 'MAX_TOKENS' });
  });

  it('잘못된 JSON은 빈 결과를 반환한다', () => {
    expect(extractGeminiDelta('nope')).toEqual({ text: '' });
  });
});

// AI 응답 텍스트를 react-live에서 실행 가능한 코드로 정규화하는 순수 함수들.
// 부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다.

/** 응답에 섞여 나온 마크다운 코드펜스(```)를 제거한다. */
export function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:jsx|tsx|javascript|typescript)?\n?/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

/**
 * react-live(noInline)는 `render(...)` 호출이 있어야 미리보기를 그린다.
 * 응답에 render 호출이 없으면 첫 컴포넌트 선언을 찾아 자동으로 주입한다.
 */
export function ensureRenderCall(code: string): string {
  if (/\brender\s*\(/.test(code)) return code;

  const match = code.match(/(?:const|function)\s+([A-Z]\w+)/);
  if (match) {
    return `${code}\n\nrender(<${match[1]} />);`;
  }
  return code;
}

/**
 * SSE 버퍼에서 완결된 이벤트의 `data:` 페이로드를 꺼내고, 미완결 꼬리는 rest로 돌려준다.
 */
export function splitSSE(buffer: string): { payloads: string[]; rest: string } {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? '';
  const payloads: string[] = [];
  for (const part of parts) {
    const data = part
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (data) payloads.push(data);
  }
  return { payloads, rest };
}

/** Anthropic 스트림 이벤트에서 텍스트 델타만 추출한다. */
export function extractAnthropicDelta(payload: string): string {
  try {
    const evt = JSON.parse(payload) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      return evt.delta.text ?? '';
    }
  } catch {
    // 잘못된 JSON은 무시한다.
  }
  return '';
}

/** Gemini 스트림 청크에서 텍스트와 finishReason을 추출한다. */
export function extractGeminiDelta(payload: string): { text: string; finishReason?: string } {
  try {
    const data = JSON.parse(payload) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return candidate?.finishReason ? { text, finishReason: candidate.finishReason } : { text };
  } catch {
    return { text: '' };
  }
}

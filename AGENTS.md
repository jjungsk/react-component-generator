# AGENTS.md

## Operational Commands

- Package manager: `bun` only. Do not use npm/yarn/pnpm (`bun.lock` is the lockfile).
- Dev (API + Vite): `bun run dev` (Vite :5173, API :3002)
- API only: `bun run server`
- Test all: `bun run test` (vitest run; covers `src/**` and `server/**`)
- Test single file: `bunx vitest run <path>`
- Lint: `bun run lint`
- Typecheck + build: `bun run build`
- Run lint, test, and build before declaring work complete.

## Golden Rules

Immutable:
- Never expose `.env` values to the client. `/api/config` returns only booleans (`server/index.ts:151-154`). Keep it that way.
- Never commit `.env` (`.gitignore`) or hardcode API keys.
- Keep the API port in sync: `server/index.ts:139` (3002) and the proxy target in `vite.config.ts:10`.

Do:
- Treat `render(<Component />)` as mandatory in generated code. react-live runs with `noInline` (`src/components/LivePreview.tsx:74`) and shows nothing without it. This is enforced twice: system prompt (`server/index.ts:12`) and `ensureRenderCall` (`server/generator.ts:238`). Do not remove either.
- Keep the system prompt rules "no imports" and "no TypeScript syntax" (`server/index.ts:11`, `:20`). The react-live scope cannot handle them.
- Put new pure response-normalizing logic in `server/generator.ts` and add a test in `server/generator.test.ts`.
- Write user-facing strings in Korean, matching existing messages.

Don't:
- Do not add side effects (`Bun.serve`, env reads) to `server/generator.ts` or `server/fallback.ts`; they are unit-tested as pure modules.
- Do not drop the status code from thrown provider errors (`Claude API error: ${status}`, `Gemini API error: ${status}`). The handler maps 503/429 by `message.includes(...)` (`server/index.ts:194`, `:201`).
- Do not put the API key anywhere that gets logged. Gemini key is already in the URL query (`server/index.ts:99`); never log that URL.

Known asymmetry (do not "fix" blindly):
- Only the Google path has model fallback (`GOOGLE_MODELS`, `server/index.ts:5`, `:135`) and `MAX_TOKENS` truncation handling (`:123`). The Anthropic path (`:68-96`) has neither. Add parity only if asked.

Test boundary:
- Tested: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`.
- Untested: `server/index.ts`, `src/hooks/useComponentGenerator.ts`, `LivePreview`, `CodeView`. Changes there need manual verification via `bun run dev`.

## Project Context

React component generator: a prompt is sent to Claude or Gemini via a Bun proxy, and the result is rendered live.
Stack: React 19, TypeScript, Vite 8, Bun, react-live, Vitest + Testing Library (jsdom).

## Standards & References

- Project overview and setup: `README.md`.
- Commit messages: Korean, `feat/fix/refactor/chore` prefix (see `commit` skill).
- Maintenance Policy: if these rules diverge from the code, propose an update to this file.

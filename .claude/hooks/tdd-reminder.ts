// PreToolUse(Write|Edit) 훅: src/**, server/** 의 .ts/.tsx 를 생성/수정하기 전에
// TDD 규칙을 컨텍스트에 주입한다. 그 외 파일은 아무것도 출력하지 않는다.
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

let filePath = "";
try {
  filePath = JSON.parse(readFileSync(0, "utf8"))?.tool_input?.file_path ?? "";
} catch {
  process.exit(0);
}

const rel = relative(root, filePath).replaceAll("\\", "/");
if (!/^(src|server)\/.+\.tsx?$/.test(rel)) process.exit(0);

const rules = readFileSync(join(root, ".claude", "rules", "tdd.md"), "utf8");

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: `[TDD 규칙 리마인더] 파일을 생성/수정하기 전에 아래 규칙을 따르라.\n\n${rules}`,
    },
  }),
);

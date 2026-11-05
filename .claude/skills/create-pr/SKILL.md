---
name: create-pr
description: 현재 브랜치의 변경사항을 분석해 템플릿에 맞는 Pull Request를 GitHub에 생성한다. "PR 만들어줘", "PR 생성", "풀리퀘스트 올려줘", "create a PR", "open a pull request" 같은 요청에 활성화한다. 이 프로젝트(react-component-generator)는 한국어 템플릿, 그 외 저장소는 영어 템플릿을 쓴다.
context: fork
---

# Create PR

현재 브랜치를 분석해 GitHub Pull Request를 생성한다. `context: fork`이므로 서브 에이전트가 격리된 컨텍스트에서 PR 생성을 대신 수행하고, 결과(PR URL)만 메인 대화로 돌려준다. 서브 에이전트는 대화 이력을 보지 못하므로 아래 절차를 스스로 완결해야 한다.

## 언어 규칙

| 대상 저장소 | PR 제목·본문 언어 | 템플릿 |
|-------------|------------------|--------|
| 현재 프로젝트 `react-component-generator` | 한국어 | `references/pr-template.ko.md` |
| 그 외 모든 저장소 | 영어 | `references/pr-template.en.md` |

판별 방법: `git remote get-url origin`의 저장소 이름(마지막 경로, `.git` 제거)이 `react-component-generator`이면 현재 프로젝트다. origin이 없으면 `git rev-parse --show-toplevel`의 디렉터리 이름으로 판단한다. 애매하면 영어를 쓴다.

## 절차

### 1. 사전 확인

- `gh auth status`로 로그인 여부 확인. 실패하면 중단하고 `gh auth login` 안내만 돌려준다.
- `git branch --show-current`로 현재 브랜치 확인. 기본 브랜치(`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`)와 같으면 PR을 만들 수 없다. 사용자에게 새 브랜치가 필요하다고 알리고 중단한다 (임의로 브랜치를 만들지 않는다).
- `git status --short`에 미커밋 변경이 있으면 PR에 포함되지 않는다는 점을 결과에 적는다. 커밋은 하지 않는다.
- 이미 열린 PR이 있는지 `gh pr view --json url,state 2>/dev/null`로 확인한다. 있으면 새로 만들지 않고 그 URL을 돌려준다.

### 2. 변경 분석

기본 브랜치를 base로 삼는다.

- `git fetch origin <base>` 후 `git log origin/<base>..HEAD --oneline`: 포함될 커밋
- `git diff origin/<base>...HEAD --stat` 및 필요한 파일의 `git diff`: 변경 내용
- 커밋이 0개면 중단하고 알린다.

### 3. 본문 작성

1. 언어 규칙에 따라 템플릿 파일을 읽는다.
2. 템플릿의 모든 섹션을 채운다. 섹션 구조·순서는 바꾸지 않는다. 해당 없는 섹션은 지우지 말고 `N/A`(한국어: `해당 없음`)로 둔다.
3. 제목: 70자 이내 한 줄. 한국어 PR은 커밋 컨벤션처럼 `feat/fix/refactor/chore: 요약` 형식, 영어 PR은 `type: summary` 형식(같은 type 4종)을 쓴다.
4. 변경 내용은 diff에서 확인한 사실만 쓴다. 실행하지 않은 테스트를 통과했다고 쓰지 않는다. 체크리스트는 실제로 확인한 항목만 체크한다.
5. 시스템 리마인더에 PR attribution 지침이 있으면 본문 끝에 그대로 덧붙인다.

### 4. push 및 생성

- 원격에 브랜치가 없거나 뒤처져 있으면 `git push -u origin <branch>`. force push는 하지 않는다.
- 본문은 임시 파일로 저장해 `--body-file`로 전달한다 (셸 인용 문제 방지).
- `gh pr create --base <base> --head <branch> --title "<제목>" --body-file <파일>`
- 사용자가 draft를 원하면 `--draft`를 붙인다.

### 5. 결과 보고

메인 대화로 다음만 돌려준다: PR URL, 제목, base←head, 사용한 언어/템플릿, 경고(미커밋 변경 등). 본문 전체를 반복하지 않는다.

## 금지 사항

- 기본 브랜치에 직접 push하거나 force push하지 않는다.
- `.env`, 키, 토큰 등 비밀 값을 PR 본문·제목에 쓰지 않는다.
- 사용자 요청 없이 PR을 merge/close하지 않는다.
- 템플릿 파일을 수정하지 않는다.

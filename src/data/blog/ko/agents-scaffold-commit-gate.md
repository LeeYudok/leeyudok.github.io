---
author: leeyudok
pubDatetime: 2026-08-25T16:54:32+09:00
title: AI 코딩 에이전트가 규칙을 못 어기게 만드는 법
featured: false
draft: false
category: dev
cover: "@/assets/images/dev/agents-scaffold-cover.png"
tags:
  - ai-agent
  - claude-code
  - git-hooks
  - agents-scaffold
description: 문서에 적은 규칙은 에이전트가 지나칩니다. 규칙을 pre-commit 훅으로 옮겨 커밋 자체를 막는 agents-scaffold를 소개합니다.
canonicalURL: https://blog.naver.com/diablodok/224389851392
lang: ko
---

![agents-scaffold: AI 에이전트가 규칙을 못 어기게 커밋 자체를 막는다](@/assets/images/dev/agents-scaffold-cover.png)

AI 코딩 에이전트에게 규칙을 지키게 하려면 규칙을 문서가 아니라 커밋 단계에 두어야 합니다. 그렇게 만든 도구가 [agents-scaffold](https://github.com/LeeYudok/agents-scaffold)입니다.

클로드 코드 같은 에이전트를 매일 쓰면 같은 문제를 되풀이해서 만납니다.

- 어제 세션에서 알려 준 규칙을 오늘 세션은 모릅니다.
- 에이전트가 `.env` 파일을 커밋합니다.
- 타입 오류가 남은 채로 커밋이 올라갑니다.
- 팀원마다 `CLAUDE.md`가 달라서 같은 프로젝트인데 결과가 다릅니다.

## 문서에만 있는 규칙은 지나친다

규칙을 잘 써 두어도 문서 안에만 있으면 언젠가 지나칩니다. 프롬프트로 준 규칙은 모델이 따르지 않을 수 있기 때문입니다.

agents-scaffold는 규칙을 설명으로 두지 않고 커밋을 막는 게이트로 만듭니다. 막는 주체는 `.git/hooks/pre-commit`입니다. 그래서 어떤 AI 도구를 쓰든 걸리고, 사람이 손으로 커밋해도 똑같이 걸립니다.

## 설치는 명령 한 줄

```bash
curl -fsSL https://raw.githubusercontent.com/leeyudok/agents-scaffold/main/bin/agents-scaffold.sh | bash -s -- --stack nextjs --yes
```

이 명령은 저장소에 `.claude/` 디렉터리와 `AGENTS.md`, 커밋 게이트를 넣습니다. `.claude/` 안에는 에이전트, 스킬, 훅, 경로별 규칙, 메모리가 들어갑니다.

## 실제로 막는 것

설치한 직후에 일부러 사고를 내 봤습니다. `.env`에 비밀번호를 넣고 강제로 스테이징한 뒤 커밋했습니다.

```console
$ bash agents-scaffold.sh . --stack python --name payments --yes
$ echo 'DB_PASSWORD=hunter2' > .env
$ git add -f .env app.py && git commit -m "feat: add config"
Blocked: a .env-type file is staged. Commit is not allowed.
```

커밋이 거부됩니다. 문서에 "커밋하지 마세요"라고 적는 것과 다릅니다.

게이트가 보는 것은 세 가지입니다.

- `.env` 계열 파일이 스테이징됐는지 봅니다.
- 고른 스택의 빌드, 타입, 린트 검사를 돌립니다.
- 인지 복잡도가 15를 넘는 함수는 경고합니다.

## 규칙을 아는 채로 시작한다

설치하면 에이전트가 프로젝트 규칙을 읽고 시작합니다. 이슈를 만들고, 브랜치를 따고, 구현하고, 테스트하고, PR을 올리는 흐름이 기본값입니다.

- **기억**: 프로젝트에서 배운 내용은 `.claude/memory/`에 쌓이고 다음 세션이 읽습니다.
- **자기 개선**: `skill-evolve`와 `agent-evolve`는 실제로 낸 실수를 그 스킬과 에이전트의 "Learned warnings"로 옮겨 적습니다.
- **병렬 작업**: 세션마다 git worktree로 나눠서 여러 세션이 같은 저장소를 만져도 서로 덮어쓰지 않습니다.

## 왜 이런 형태인가

agents-scaffold에는 런타임도, 플러그인 시스템도, 중앙 레지스트리도 없습니다. `.claude/` 뼈대와 스택별 프리셋을 저장소에 한 번 복사하면 그다음부터는 내 코드입니다. 포크해서 채우고, 필요 없는 것은 지우면 됩니다.

규칙은 P0, P1, P2 세 단계로 나뉩니다. P0은 시크릿 노출, 파괴적 SQL, force push처럼 예외가 없는 규칙입니다. 규칙 파일은 관련 경로의 파일을 건드릴 때만 읽히므로 컨텍스트를 덜 씁니다.

## 한계

훅은 만능이 아닙니다. `git commit --no-verify`를 쓰면 pre-commit 훅을 건너뜁니다. 이 경우까지 막으려면 CI에서 같은 검사를 한 번 더 돌려야 합니다.

훅이 잡는 것은 기계로 판정할 수 있는 실수뿐입니다. 설계가 맞는지, 요구사항을 제대로 구현했는지는 여전히 사람이 봐야 합니다.

## 지금 상태

2026-11-17 기준으로 Claude Code, Codex, Antigravity를 지원합니다. 스택 프리셋은 13개입니다. MIT 라이선스로 공개돼 있습니다.

같은 글을 [네이버 블로그](https://blog.naver.com/diablodok/224389851392)에도 올렸습니다.

---
author: leeyudok
pubDatetime: 2026-11-17T00:16:00+09:00
title: 요즘 공부하는 것...들 2탄 — 터미널로 옮겨 온 도구
featured: false
draft: false
category: dev
tags:
  - dev
  - tools
  - cli
  - claude-code
description: 1탄은 Windows와 폐쇄망의 GUI 도구였습니다. 2탄은 맥 터미널에서 매일 쓰는 도구를 버전, 설정, 겪은 함정과 함께 적습니다.
lang: ko
---

[1탄](/posts/ko/dev-tools-guide/)은 Windows와 폐쇄망에서 쓰는 GUI 도구를 정리했습니다. 2탄은 맥 터미널에서 매일 쓰는 도구입니다. 여덟 달 사이에 손이 가는 곳이 편집기에서 터미널로 옮겨 왔기 때문입니다.

버전은 2026-11-17에 제 맥(M4 Pro)에서 `--version`으로 확인한 값입니다. 설정은 실제로 쓰는 것을 옮겼고, 함정은 직접 겪은 것만 적었습니다.

## 매일 쓰는 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| **Claude Code** | 2.1.325 | 터미널에서 도는 AI 코딩 에이전트 |
| **Git** | 2.54.0 | 버전 관리 |
| **gh** / **glab** | 2.96.0 / 1.99.0 | GitHub, GitLab을 터미널에서 다룬다 |
| **ripgrep** (`rg`) | 15.2.0 | 코드 검색 |
| **fd** | 10.4.2 | 파일 찾기 |
| **jq** | 1.7.1 | JSON 가공 |
| **pnpm** / **Bun** | 12.21.0 / 1.4.2 | JS 패키지 관리와 실행 |
| **uv** | 0.12.5 | 파이썬 도구 실행과 가상환경 |
| **Podman** | 6.1.4 | 컨테이너 |

## 있으면 편한 도구

| 도구 | 버전 | 용도 |
|------|------|------|
| `eza` | | `ls` 대신. 깃 상태와 수정 시각을 함께 본다 |
| `bat` | 0.26.1 | `cat` 대신. 문법 색을 입힌다 |
| `fzf` | 0.74.4 | 목록에서 골라 찾기 |
| `zoxide` | 0.9.9 | 자주 가는 폴더로 이동 |
| `ccusage` | 20.0.20 | Claude Code 토큰 사용량 집계 |
| `codegraph` | 1.6.2 | 저장소의 심볼과 호출 관계 색인 |
| `age` | 1.3.2 | 파일 암호화 |
| `autossh` | 1.4g | 끊기면 다시 붙는 SSH 터널 |
| `shellcheck` | | 셸 스크립트 검사 |

---

## 1. Claude Code

1탄에서는 VS Code의 권장 확장 목록에 있었습니다. 지금은 터미널에서 CLI로 씁니다. 편집기를 거치지 않고 저장소에서 바로 읽고, 고치고, 빌드하고, 푸시합니다.

써 보고 정착한 방식은 세 가지입니다.

- **규칙은 파일에 둡니다.** 전역 규칙은 `~/.claude/CLAUDE.md`에, 저장소 규칙은 `AGENTS.md`에 적습니다. 세션이 바뀌어도 같은 규칙으로 시작합니다.
- **위험한 명령은 훅으로 막습니다.** force push나 `reset --hard` 같은 명령은 실행 전 훅이 거부합니다. 문서에 "하지 마라"고 적는 것으로는 부족했습니다. 이 내용은 [AI 코딩 에이전트가 규칙을 못 어기게 만드는 법](/posts/ko/agents-scaffold-commit-gate/)에 따로 썼습니다.
- **끝났다는 보고에는 확인 결과를 받습니다.** 배포했다고 하면 실행 링크와 응답 코드를 같이 받습니다.

### 함정

에이전트는 틀린 내용도 맞는 내용과 같은 말투로 말합니다. 그래서 수치, 날짜, 출처는 원문과 대조합니다. 이 블로그의 글 한 편을 옮길 때도 논문 연도 하나가 틀려 있었습니다.

---

## 2. 셸 기본 명령 바꾸기

`~/.zshrc`에 넣어 쓰는 별칭입니다.

```bash
alias ls='eza --icons --group-directories-first'
alias ll='eza -l --icons --git --sort=modified'
alias cat='bat --paging=never'
```

`ll`은 최근에 고친 파일이 아래에 오고 깃 상태가 옆에 붙습니다. 방금 무엇을 건드렸는지 바로 보입니다.

검색은 `grep`과 `find` 대신 `rg`와 `fd`를 씁니다. 둘 다 `.gitignore`를 따르므로 `node_modules`를 뒤지지 않습니다.

```bash
rg -n "injectRoute" --glob '*.js'    # 내용 검색
fd -e md . src/data/blog             # 이름으로 찾기
```

### 함정

별칭은 대화형 셸에서만 적용됩니다. 스크립트 안의 `cat`은 원래 `cat`입니다. 반대로 터미널에서 원래 명령이 필요하면 `command cat`처럼 씁니다.

---

## 3. gh와 glab

저장소 만들기, 배포 확인, API 호출을 브라우저 없이 합니다. 이 블로그의 테마 레포도 이렇게 만들었습니다.

```bash
gh repo create LeeYudok/astro-theme-doksam --public --source . --remote origin --push
gh run watch <실행 번호> --exit-status     # 배포가 끝날 때까지 기다리고 실패하면 0이 아닌 값
gh api 'repos/OWNER/REPO/commits?per_page=10' -q '.[].commit.message'
```

### 함정

zsh에서는 `?`가 들어간 주소를 따옴표로 감싸야 합니다. 감싸지 않으면 셸이 `?`를 파일 이름 패턴으로 읽습니다.

```text
$ gh api repos/OWNER/REPO/commits?per_page=10
zsh: no matches found: repos/OWNER/REPO/commits?per_page=10
```

---

## 4. pnpm과 Bun

1탄에서는 Bun 하나였습니다. 지금은 프론트엔드 저장소에는 pnpm을, 스크립트 실행과 작은 서버에는 Bun을 씁니다.

pnpm은 깃 저장소를 의존성으로 받을 수 있습니다. 락파일에는 태그가 아니라 커밋 해시가 적힙니다.

```json
"astro-theme-doksam": "github:LeeYudok/astro-theme-doksam#v0.1.0"
```

### 함정

로컬과 CI의 pnpm 버전이 다르면 같은 명령의 결과가 달라집니다. 제 맥의 pnpm 12는 의존성의 설치 스크립트를 막고 오류 코드를 돌려줍니다.

```text
Error: ERR_PNPM_IGNORED_BUILDS
  Ignored build scripts: esbuild@0.25.0, sharp@0.34.5
```

같은 저장소가 CI의 pnpm 9에서는 그대로 설치됩니다. 빌드는 양쪽 다 통과했지만 설치 명령의 종료 코드가 달랐습니다. CI 설정에 pnpm 버전을 적어 두고, 로컬 결과가 다르면 버전부터 봅니다.

---

## 5. uv

파이썬 도구를 전역에 깔지 않고 씁니다. `pipx` 자리를 `uv`가 대신합니다.

```bash
uvx ruff check .          # 설치 없이 한 번 실행
uv venv && uv pip install -r requirements.txt
```

파이썬을 주력으로 쓰지 않아서 깊게 쓰지는 않습니다. 도구를 설치 없이 한 번 실행하는 용도로 둡니다.

---

## 6. Podman

서버의 컨테이너는 루트 권한 없이 Podman으로 돌립니다. 서비스 등록은 Quadlet을 씁니다. `.container` 파일을 두면 systemd 서비스가 됩니다.

```ini
# ~/.config/containers/systemd/myapp.container
[Container]
Image=localhost/myapp:local
PublishPort=127.0.0.1:8080:8080
EnvironmentFile=%h/app/.env

[Service]
Restart=always

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user start myapp.service
podman logs myapp
```

### 함정

이미지를 빌드할 때 `ENV X=${ARG}`로 버전을 넣으면 값이 바뀌어도 캐시된 층이 쓰였습니다. 버전은 파일에 적고 `COPY`로 넣습니다. 파일은 내용이 바뀌면 캐시가 깨집니다.

---

## 7. 시크릿은 암호화해서 커밋한다

`.env`를 서버에만 두면 서버를 다시 만들 때 값을 잃습니다. 그래서 암호화한 파일을 저장소에 둡니다. 서버에서는 `sops`와 `age`를 씁니다. 값만 암호화하고 키 이름은 평문으로 남깁니다.

```bash
# 암호화해서 커밋
sops -e --input-type dotenv --output-type dotenv .env > deploy/secrets/app.env.sops

# 배포할 때 풀어서 쓰기
sops -d --input-type dotenv --output-type dotenv deploy/secrets/app.env.sops > app/.env
chmod 600 app/.env
```

개인 키는 저장소에 넣지 않고 따로 백업합니다. 이 키를 잃으면 암호화한 파일을 모두 열 수 없습니다.

---

## 8. SSH 터널

집 서버의 DB는 밖으로 열지 않습니다. 맥에서는 SSH 터널로 `127.0.0.1`에 붙습니다. `autossh`는 연결이 끊기면 다시 붙습니다.

```bash
autossh -M 0 -N -L 5432:127.0.0.1:5432 myserver
```

### 함정

SSH로 원격 명령을 보낼 때 `pkill -f`가 자기 자신을 죽일 수 있습니다. 원격 셸의 명령줄에도 찾는 글자가 들어 있기 때문입니다. 그러면 뒤의 명령이 실행되지 않습니다.

```bash
ssh myserver 'pkill -f "vllm serve"; echo done'      # 원격 셸이 같이 죽는다
ssh myserver 'pkill -f "[v]llm serve"; echo done'    # 대괄호로 자기 매칭을 피한다
```

---

## 9. 정적 사이트: Astro, Hugo, Pagefind

이 블로그는 Astro로 만듭니다. 같은 화면을 Hugo 테마로도 만들었습니다. 검색은 둘 다 Pagefind를 씁니다. 빌드가 끝난 HTML을 읽어 색인을 만들기 때문에 서버가 필요 없습니다.

2026-11-17에 제 맥에서 잰 빌드 시간입니다.

| | 쪽 수 | 빌드 시간 |
|---|---|---|
| Astro 5.16.6 (이 블로그) | 80쪽 | 0.95초 |
| Hugo 0.170.0 (테마 예제 사이트) | 45쪽 | 0.021초 |

두 사이트는 내용과 쪽 수가 달라서 같은 조건의 비교가 아닙니다. 자릿수가 다르다는 정도만 읽으면 됩니다.

- [astro-theme-doksam](https://github.com/LeeYudok/astro-theme-doksam)
- [hugo-theme-doksam](https://github.com/LeeYudok/hugo-theme-doksam)

테마를 따로 떼어 낸 과정은 [Astro 테마를 별도 레포로 빼서 블로그에 끼워 쓰기](/posts/ko/astro-theme-as-integration/)에 적었습니다.

---

## 10. ccusage

Claude Code가 남긴 로그를 읽어 토큰 사용량과 비용을 집계합니다.

```bash
ccusage daily
```

### 함정

실행 중인 세션은 로그를 계속 씁니다. 그래서 같은 명령을 두 번 돌리면 수치가 달라집니다. 전후를 비교하려면 로그 폴더를 복사해 두고 그 사본을 읽게 합니다.

```bash
cp -R ~/.claude /tmp/claude-snapshot
CLAUDE_CONFIG_DIR=/tmp/claude-snapshot ccusage daily
```

---

## 1탄에서 바뀐 것

| 1탄 (2026-03) | 2탄 (2026-11) |
|---|---|
| VS Code 확장으로 쓰는 Claude Code | 터미널 CLI로 쓰는 Claude Code |
| Bun 하나 | pnpm과 Bun을 나눠 쓴다 |
| TortoiseGit 같은 GUI | `gh`, `glab` |
| DBeaver로 SQLite 조회 | SSH 터널로 서버 DB에 접속 |

1탄의 도구가 낡은 것은 아닙니다. Windows와 폐쇄망에서는 지금도 1탄의 도구가 맞습니다. 2탄은 인터넷이 되는 맥에서 일할 때의 목록입니다.

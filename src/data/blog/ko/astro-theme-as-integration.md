---
author: leeyudok
pubDatetime: 2026-11-17T00:10:00+09:00
title: Astro 테마를 별도 레포로 빼서 블로그에 끼워 쓰기
featured: false
draft: false
category: dev
cover: "@/assets/images/dev/astro-theme-home.png"
tags:
  - astro
  - astro-integration
  - blog
  - github-pages
description: 템플릿을 복사해 쓰던 블로그에서 테마를 Astro 통합으로 떼어 냈습니다. 구조, 막힌 곳 네 군데, 전후 수치를 적습니다.
lang: ko
---

블로그 테마를 별도 레포로 떼어 냈습니다. 블로그 레포에는 글과 설정만 남았습니다. 추적 파일은 152개에서 32개로 줄었고 글 주소 10개는 그대로입니다.

- 테마: [LeeYudok/astro-theme-doksam](https://github.com/LeeYudok/astro-theme-doksam)
- 블로그: [LeeYudok/leeyudok.github.io](https://github.com/LeeYudok/leeyudok.github.io)

![새 테마를 입힌 블로그 첫 화면. 왼쪽 증시, 오른쪽 개발](@/assets/images/dev/astro-theme-home.png)

작업은 2026-11-16 저녁에 Claude Code와 함께 했습니다. 아래 수치는 그날 제 맥(M4 Pro)과 GitHub Actions에서 나온 값입니다.

## 왜 떼어 냈나

이 블로그는 2026년 3월에 AstroPaper 템플릿을 복사해서 시작했습니다. 템플릿을 복사하면 테마 소스가 내 레포에 섞입니다. 여덟 달 쓰는 동안 세 가지가 걸렸습니다.

- **남의 파일이 남습니다.** 테마 사용법을 설명하는 샘플 글 13개와 원작자 후원 설정(`FUNDING.yml`)이 제 레포에 그대로 있었습니다.
- **테마를 올리지 못했습니다.** 블로그 레포는 2026-03-21 이후 2026-11-16까지 커밋이 없었습니다. 그 사이 테마 원본의 변경을 한 번도 받지 않았습니다.
- **화면 구조가 맞지 않았습니다.** 증시 요약과 개발 글을 첫 화면에 나란히 두고 싶었는데 템플릿은 글 목록 하나만 그립니다.

## 구조: 테마가 화면을 주입한다

Astro 통합(integration)은 빌드 설정에 끼어드는 플러그인입니다. 테마를 통합으로 만들면 블로그는 `astro.config.ts`에 한 줄만 추가합니다. 테마가 하는 일은 세 가지입니다.

**1. 화면을 주입합니다.** `injectRoute`로 주소와 화면 파일을 잇습니다. 블로그의 `src/pages/`에 파일이 없어도 화면이 생깁니다.

```js
for (const locale of config.locales) {
  const p = locale === config.defaultLocale ? "" : `/${locale}`;
  injectRoute({ pattern: `${p}/`, entrypoint: page("Home.astro") });
  injectRoute({ pattern: `${p}/posts`, entrypoint: page("Posts.astro") });
  for (const section of config.sections) {
    injectRoute({ pattern: `${p}/${section.id}`, entrypoint: page("Section.astro") });
  }
}
```

같은 화면 파일을 주소 여러 개에 이어도 됩니다. `Home.astro` 하나가 `/`와 `/en/`을 그렸고, 화면은 주소를 보고 언어를 정합니다.

**2. 설정을 가상 모듈로 넘깁니다.** 블로그가 넘긴 옵션을 Vite 플러그인이 `virtual:doksam/config`라는 모듈로 만듭니다. 테마의 화면은 이 모듈을 읽습니다.

```js
function virtualConfig(config) {
  const resolved = "\0" + VIRTUAL;
  return {
    name: "astro-theme-doksam:config",
    resolveId(id) {
      if (id === VIRTUAL) return resolved;
    },
    load(id) {
      if (id === resolved) return `export default ${JSON.stringify(config)};`;
    },
  };
}
```

**3. 글 머리말 스키마를 내보냅니다.** 블로그의 `src/content.config.ts`는 테마의 스키마를 가져다 씁니다.

```ts
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema } from "astro-theme-doksam/schema";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/data/blog" }),
  schema: blogSchema,
});

export const collections = { blog };
```

블로그 쪽 설정은 이것이 전부입니다.

```ts
doksam({
  title: "덕삼ol야기",
  defaultLocale: "ko",
  locales: ["ko", "en"],
  sections: [
    { id: "market", label: { ko: "증시", en: "Markets" } },
    { id: "dev", label: { ko: "개발", en: "Dev" } },
  ],
  nav: [{ label: { ko: "소개", en: "About" }, href: "/about" }],
});
```

## 막힌 곳 네 군데

### 1. 오류 위치가 엉뚱한 줄을 가리켰다

첫 빌드가 이렇게 실패했습니다.

```text
[ERROR] [vite] ✗ Build failed in 310ms
Unexpected "!"
  Location: src/layouts/Base.astro:66:1
```

66번째 줄에는 `!`가 없었습니다. 머리말 부분의 식을 세 번 고쳤지만 오류는 그대로였습니다. 줄 번호만 제가 스크립트 영역에 더한 줄 수만큼 밀렸습니다. 그래서 원인이 스크립트 영역에 있다고 보고 Astro 컴파일러로 파일을 직접 변환해 봤습니다. 원인은 템플릿 리터럴 안에 템플릿 리터럴을 넣은 줄이었습니다.

```ts
// 실패
const rssHref = `${lang === config.defaultLocale ? "" : `/${lang}`}/rss.xml`;
// 통과
const rssHref = prefix(lang) + "/rss.xml";
```

이 줄을 바꾸자 빌드가 통과했습니다. 컴파일러와 esbuild 가운데 어느 쪽이 이 문법을 잘못 읽는지는 확인하지 않았습니다. 확인한 것은 이 한 줄을 바꾸면 오류가 사라진다는 사실입니다.

### 2. 컴포넌트의 스타일이 자식 컴포넌트에 닿지 않았다

밝게·어둡게 버튼에 해와 달 아이콘이 함께 보였습니다. 머리말 컴포넌트의 `<style>`에서 아이콘을 숨겼는데, 아이콘은 별도 컴포넌트가 그리는 요소였습니다. Astro는 `<style>`을 그 컴포넌트가 직접 쓴 요소에만 적용합니다. 숨김 규칙을 전역 CSS로 옮겨서 고쳤습니다.

```css
:root[data-theme="dark"] .when-light,
:root:not([data-theme="dark"]) .when-dark {
  display: none;
}
```

### 3. 언어별 글 주소는 화면 파일을 둘로 나눴다

글 화면은 주소 두 개가 씁니다. `/posts/[...slug]`(기본 언어)와 `/[locale]/posts/[...slug]`(나머지 언어)입니다. 두 주소는 `getStaticPaths`가 돌려줘야 하는 값이 다릅니다. 뒤쪽에는 `locale`이 더 필요합니다.

저는 `PostDefault.astro`와 `PostLocale.astro`로 진입 파일을 나누고 본문은 `PostView.astro` 하나를 같이 쓰게 했습니다.

나중에 타입 정의를 보니 Astro 5.16.6의 `getStaticPaths`는 `routePattern`을 받습니다. 이 값을 쓰면 파일 하나로 합칠 수 있을 것으로 봅니다. 아직 해 보지는 않았습니다.

### 4. 통합의 진입 파일은 자바스크립트로 썼다

`astro.config.ts`가 불러오는 통합 진입 파일과 스키마 파일은 `.ts`가 아니라 `.js`로 썼습니다. 타입은 `.d.ts`로 따로 둡니다.

Node.js는 `node_modules` 아래 파일의 타입 제거를 지원하지 않습니다. [Node.js 문서](https://nodejs.org/api/typescript.html)에 적혀 있습니다. 패키지는 설치되면 `node_modules`에 놓입니다. 실패를 재현해 본 것은 아니고 문서를 따라 피했습니다. `.astro` 화면 파일은 Vite가 처리하므로 안에서 타입스크립트를 써도 됩니다.

## 전후 수치

| 항목 | 이전 (AstroPaper 복사본) | 이후 (테마 분리) |
|---|---|---|
| 블로그 레포 추적 파일 | 152개 | 32개 |
| 빌드한 쪽 수 | 92쪽 | 56쪽 |
| `astro build` 시간 (M4 Pro) | 14.36초 | 약 0.9초 |
| 글 주소 | 10개 | 10개, 모두 같음 |

빌드 시간은 같은 조건의 비교가 아닙니다. 이전 빌드에는 샘플 글과 글마다 만들던 공유용 이미지가 들어 있었습니다. 새 테마가 빠른 것이 아니라 하는 일이 줄었습니다.

전환 커밋은 파일 130개를 바꿨고 200줄을 더하고 18,911줄을 지웠습니다. 지운 줄 가운데 11,311줄은 락파일 두 개입니다. 락파일을 빼면 7,600줄입니다. 테마 레포는 파일 44개이고, 락파일·아이콘·라이선스를 뺀 소스와 문서는 1,993줄입니다.

확인한 것은 다음과 같습니다.

- `astro check`: 오류 0, 경고 0, 힌트 0
- 전환 전후 빌드 결과의 글 주소 10개 대조: 모두 같음
- 배포 뒤 첫 화면, 섹션 목록, 글, 영어판, 태그, 검색, 소개, RSS 등 주소 11개: 모두 200

## 버린 것

새 테마에 넣지 않은 기능이 있습니다. 필요해지면 그때 만듭니다.

- 아카이브 화면(`/archives/`)
- 글마다 자동으로 만들던 공유용 이미지. 지금은 `cover`로 지정한 이미지만 씁니다.
- 목록의 쪽 나눔. 글이 적어서 한 화면에 다 나옵니다.
- Astro `base` 설정. 사이트가 도메인 루트에 있다고 봅니다.

## 테마를 올리는 방법

블로그는 테마를 깃 태그로 가져옵니다.

```json
"astro-theme-doksam": "github:LeeYudok/astro-theme-doksam#v0.1.0"
```

pnpm은 락파일에 태그가 아니라 커밋 해시가 들어간 압축 파일 주소를 적습니다. `v0.1.0`은 커밋 `a4ece0b`로 고정됐습니다. 태그가 나중에 다른 커밋을 가리켜도 락파일을 다시 만들기 전에는 설치 결과가 바뀌지 않습니다.

테마를 고치면 새 태그를 만들고 블로그의 `package.json`에서 태그를 바꿉니다.

## 이 방식이 맞는 경우

테마를 떼어 내면 레포가 둘이 됩니다. 화면 하나를 고치려면 테마 레포에서 고치고, 태그를 만들고, 블로그에서 버전을 올려야 합니다. 블로그가 하나뿐이고 화면을 자주 고친다면 이 절차가 짐입니다.

지금 이 테마를 쓰는 곳은 이 블로그 하나입니다. 그래서 재사용 이득은 아직 없습니다. 얻은 것은 두 가지입니다. 글 레포의 이력에 화면 코드 변경이 섞이지 않습니다. 남의 템플릿에 딸려 온 파일이 사라졌습니다.

템플릿 복사가 더 나은 경우도 분명합니다. 처음 시작하거나, 테마를 거의 고치지 않거나, 원본 업데이트를 따라가지 않을 생각이라면 복사가 빠릅니다.

## 참고

- [Astro Integration API](https://docs.astro.build/en/reference/integrations-reference/): `injectRoute`와 `updateConfig`
- [Node.js: Modules: TypeScript](https://nodejs.org/api/typescript.html): `node_modules` 아래 타입 제거 제한
- [astro-theme-doksam README](https://github.com/LeeYudok/astro-theme-doksam#readme): 설치와 설정

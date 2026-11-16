# 덕삼ol야기

<https://leeyudok.github.io/> 의 원본이다. 증시 요약과 개발 글을 올린다.

화면은 [astro-theme-doksam](https://github.com/LeeYudok/astro-theme-doksam) 테마가 그린다. 이 레포에는 글과 설정만 둔다.

| 위치 | 내용 |
|---|---|
| `src/data/blog/ko/`, `src/data/blog/en/` | 글(마크다운). 파일 경로가 주소가 된다 |
| `src/assets/images/` | 글에 넣는 이미지 |
| `src/pages/about.md`, `src/pages/en/about.md` | 소개 화면 |
| `astro.config.ts` | 사이트 이름, 섹션, 메뉴 등 테마 설정 |

## 실행

```bash
pnpm install
pnpm dev      # http://localhost:4321
pnpm build    # 타입 검사, 빌드, 검색 색인
```

## 글 쓰기

`src/data/blog/ko/<이름>.md` 를 만든다. 머리말 항목은 테마 README 의 "글 쓰기" 절을 따른다. 증시 글은 `category: market` 과 `cover` 를 넣는다.

## 배포

`master` 에 푸시하면 GitHub Actions(`.github/workflows/deploy.yml`)가 GitHub Pages 에 올린다.

## 테마 올리기

`package.json` 의 `astro-theme-doksam` 태그를 바꾸고 `pnpm install` 을 다시 한다.

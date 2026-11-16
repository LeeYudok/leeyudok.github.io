import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import doksam from "astro-theme-doksam";

// https://astro.build/config
export default defineConfig({
  site: "https://leeyudok.github.io/",
  integrations: [
    doksam({
      title: "덕삼ol야기",
      description: {
        ko: "뉴월드 인생2회차 그리고 ... 증시, 개발, 생각을 기록합니다.",
        en: "New World, 2nd playthrough, and ... Notes on markets, development, and thoughts.",
      },
      author: "leeyudok",
      profile: "https://github.com/leeyudok",
      defaultLocale: "ko",
      locales: ["ko", "en"],
      sections: [
        { id: "market", label: { ko: "증시", en: "Markets" } },
        { id: "dev", label: { ko: "개발", en: "Dev" } },
      ],
      nav: [{ label: { ko: "소개", en: "About" }, href: "/about" }],
      socials: [
        { label: "GitHub", href: "https://github.com/leeyudok", icon: "github-logo" },
        {
          label: "네이버 블로그",
          href: "https://blog.naver.com/diablodok",
          icon: "arrow-up-right",
        },
      ],
    }),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
});

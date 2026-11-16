import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { blogSchema } from "astro-theme-doksam/schema";

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/data/blog" }),
  schema: blogSchema,
});

export const collections = { blog };

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import matter from "gray-matter";
import { z } from "zod";

import {
  parsePostFilename,
  postFrontmatterSchema,
  selectPublishedPosts,
  type PostMeta,
} from "../src/content/postMeta";

const postsDir = join(import.meta.dirname, "../content/posts");

/** Published posts only, sorted. Same set as `src/content/posts` `posts`. */
export function readPostFiles(): PostMeta[] {
  const fileNames = readdirSync(postsDir).filter((name) =>
    name.endsWith(".md"),
  );
  const all: PostMeta[] = fileNames.map((fileName) => {
    const filePath = join(postsDir, fileName);
    let date: string;
    let slug: string;
    try {
      ({ date, slug } = parsePostFilename(fileName));
    } catch {
      throw new Error(`${filePath}: filename must match YYYY-MM-DD-{slug}.md`);
    }

    const raw = readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const parsed = postFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(
        `${filePath}: invalid frontmatter:\n${z.prettifyError(parsed.error)}`,
      );
    }
    if (content.trim().length === 0) {
      throw new Error(`${filePath}: post body is empty`);
    }

    return { ...parsed.data, date, slug };
  });

  return selectPublishedPosts(all);
}

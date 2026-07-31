import matter from "gray-matter";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { Plugin } from "vite";
import { z } from "zod";

import {
  parsePostFilename,
  postFrontmatterSchema,
} from "../src/content/postMeta";

type PostExport = "both" | "meta" | "html";

function parseMarkdownId(id: string): {
  filePath: string;
  fileName: string;
  postExport: PostExport;
} {
  const qIndex = id.indexOf("?");
  const filePath = qIndex === -1 ? id : id.slice(0, qIndex);
  const query = qIndex === -1 ? "" : id.slice(qIndex + 1);
  const fileName = filePath.split(/[/\\]/).pop() ?? filePath;

  // Separate module IDs (?meta / ?html) so Rollup can code-split body from list meta.
  const params = new URLSearchParams(query);
  let postExport: PostExport = "both";
  if (params.has("meta") && !params.has("html")) {
    postExport = "meta";
  } else if (params.has("html") && !params.has("meta")) {
    postExport = "html";
  }

  return { filePath, fileName, postExport };
}

export function markdown(): Plugin {
  return {
    name: "markdown-posts",
    async transform(code, id) {
      const { filePath, fileName, postExport } = parseMarkdownId(id);
      if (!filePath.endsWith(".md")) {
        return null;
      }
      // Only site content posts — ignore docs/**/*.md and other markdown.
      if (!filePath.includes("/content/posts/")) {
        return null;
      }

      let date: string;
      let slug: string;
      try {
        ({ date, slug } = parsePostFilename(fileName));
      } catch {
        throw new Error(
          `${filePath}: filename must match YYYY-MM-DD-{slug}.md`,
        );
      }

      const { data, content } = matter(code);
      const parsed = postFrontmatterSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error(
          `${filePath}: invalid frontmatter:\n${z.prettifyError(parsed.error)}`,
        );
      }

      if (content.trim().length === 0) {
        throw new Error(`${filePath}: post body is empty`);
      }

      const meta = { ...parsed.data, date, slug };
      const parts: string[] = [];

      if (postExport === "both" || postExport === "meta") {
        parts.push(`export const meta = ${JSON.stringify(meta)};`);
      }

      if (postExport === "both" || postExport === "html") {
        // Skip unified when only meta is requested so the list graph never sees HTML strings.
        const html = String(
          await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype)
            .use(rehypeStringify)
            .process(content),
        );
        parts.push(`export const html = ${JSON.stringify(html)};`);
      }

      return {
        code: `${parts.join("\n")}\n`,
        map: null,
      };
    },
  };
}

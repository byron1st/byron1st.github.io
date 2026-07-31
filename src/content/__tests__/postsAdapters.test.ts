import { describe, expect, it } from "vitest";

import { markdown } from "../../../plugins/markdown";
import { posts, loadPostBody } from "../posts";
import { readPostFiles } from "../../../scripts/postFiles";

async function transformMarkdown(
  code: string,
  id: string,
): Promise<{ code: string; map: null } | null | undefined> {
  const plugin = markdown();
  const transform = plugin.transform;
  if (typeof transform !== "function") {
    throw new Error("markdown plugin transform is not a function");
  }
  // PluginContext is unused by this transform; empty object is enough.
  return transform.call({} as never, code, id) as Promise<{
    code: string;
    map: null;
  } | null>;
}

describe("posts adapters", () => {
  it("excludes draft posts from both posts and readPostFiles", () => {
    const bundleSlugs = posts.map((p) => p.slug).sort();
    const nodeSlugs = readPostFiles()
      .map((p) => p.slug)
      .sort();

    expect(bundleSlugs).toEqual(nodeSlugs);
    expect(bundleSlugs).toContain("building-this-site");
    expect(bundleSlugs).not.toContain("draft-notes");
    expect(posts.every((p) => p.draft === false)).toBe(true);
    expect(readPostFiles().every((p) => p.draft === false)).toBe(true);
  });

  it("returns the same sorted PostMeta records from both adapters", () => {
    const node = readPostFiles();
    expect(posts).toEqual(node);
    expect(posts.map((p) => p.slug)).toEqual(["building-this-site"]);
    expect(posts[0]).toMatchObject({
      title: "이 사이트를 만든 기록",
      summary:
        "텍스트 우선 미니멀 정적 사이트를 React Router 8 SSG로 구성하면서 스택을 고른 이유.",
      draft: false,
      date: "2026-07-29",
      slug: "building-this-site",
    });
  });

  it("loads the published post body as HTML", async () => {
    const html = await loadPostBody("building-this-site");
    expect(html).toContain("<h2>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<pre>");
    expect(html).toContain("정적 사이트");
    expect(html).toContain("<p>");
    expect(html).toContain("<code>");
  });

  it("throws when the slug is missing", async () => {
    await expect(loadPostBody("does-not-exist")).rejects.toThrow(
      /Post not found for slug "does-not-exist"/,
    );
  });

  it("rejects draft slugs the same as missing posts", async () => {
    await expect(loadPostBody("draft-notes")).rejects.toThrow(
      /Post not found for slug "draft-notes"/,
    );
  });
});

const samplePost = `---
title: 제목
summary: 요약
date: 2000-01-01
slug: from-frontmatter
---

## Heading

> quote

\`\`\`ts
const x = 1;
\`\`\`
`;

describe("markdown plugin transform", () => {
  const postsRoot = "/repo/content/posts";

  it("emits meta from the filename and html from the body", async () => {
    const id = `${postsRoot}/2026-04-02-hello-world.md`;
    const result = await transformMarkdown(samplePost, id);
    expect(result).toBeTruthy();
    if (!result) {
      return;
    }
    expect(result.code).toContain("export const meta =");
    expect(result.code).toContain("export const html =");

    const metaMatch = /export const meta = (\{.*\});/.exec(result.code);
    expect(metaMatch).toBeTruthy();
    const meta = JSON.parse(metaMatch?.[1] ?? "null") as {
      title: string;
      summary: string;
      draft: boolean;
      date: string;
      slug: string;
    };
    expect(meta).toEqual({
      title: "제목",
      summary: "요약",
      draft: false,
      date: "2026-04-02",
      slug: "hello-world",
    });

    const htmlMatch = /export const html = ("(?:\\.|[^"\\])*");/.exec(
      result.code,
    );
    expect(htmlMatch).toBeTruthy();
    const html = JSON.parse(htmlMatch?.[1] ?? '""') as string;
    expect(html).toContain("<h2>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<pre>");
  });

  it("emits only meta for ?meta so list modules never carry html strings", async () => {
    const id = `${postsRoot}/2026-04-02-hello-world.md?meta`;
    const result = await transformMarkdown(samplePost, id);
    expect(result).toBeTruthy();
    if (!result) {
      return;
    }
    expect(result.code).toContain("export const meta =");
    expect(result.code).not.toContain("export const html");
    expect(result.code).not.toContain("<h2>");
    expect(result.code).not.toContain("blockquote");

    // Meta still comes from the filename + frontmatter (not a stub) when split.
    const metaMatch = /export const meta = (\{.*\});/.exec(result.code);
    expect(metaMatch).toBeTruthy();
    const meta = JSON.parse(metaMatch?.[1] ?? "null") as {
      title: string;
      summary: string;
      draft: boolean;
      date: string;
      slug: string;
    };
    expect(meta).toEqual({
      title: "제목",
      summary: "요약",
      draft: false,
      date: "2026-04-02",
      slug: "hello-world",
    });
  });

  it("emits only html for ?html so body loads as a separate module id", async () => {
    const id = `${postsRoot}/2026-04-02-hello-world.md?html`;
    const result = await transformMarkdown(samplePost, id);
    expect(result).toBeTruthy();
    if (!result) {
      return;
    }
    expect(result.code).toContain("export const html =");
    expect(result.code).not.toContain("export const meta");
    expect(result.code).toContain("<h2>");
    expect(result.code).toContain("<blockquote>");
    expect(result.code).toContain("<pre>");
  });

  it("emits both meta and html when ?meta and ?html are both present", async () => {
    const id = `${postsRoot}/2026-04-02-hello-world.md?meta&html`;
    const result = await transformMarkdown(samplePost, id);
    expect(result).toBeTruthy();
    if (!result) {
      return;
    }
    expect(result.code).toContain("export const meta =");
    expect(result.code).toContain("export const html =");
    expect(result.code).toContain("<h2>");
  });

  it("keeps meta-only when ?meta has extra unrelated query params", async () => {
    const id = `${postsRoot}/2026-04-02-hello-world.md?meta&v=1`;
    const result = await transformMarkdown(samplePost, id);
    expect(result).toBeTruthy();
    if (!result) {
      return;
    }
    expect(result.code).toContain("export const meta =");
    expect(result.code).not.toContain("export const html");
  });

  it("throws with the file path when the filename is invalid", async () => {
    const id = `${postsRoot}/not-a-valid-name.md`;
    await expect(
      transformMarkdown("---\ntitle: t\nsummary: s\n---\n\nbody\n", id),
    ).rejects.toThrow(/not-a-valid-name\.md: filename must match/);
  });

  it("throws with the file path when frontmatter is invalid", async () => {
    const id = `${postsRoot}/2026-04-02-missing-summary.md`;
    await expect(
      transformMarkdown("---\ntitle: only-title\n---\n\nbody\n", id),
    ).rejects.toThrow(/missing-summary\.md: invalid frontmatter/);
  });

  it("throws with the file path when the body is empty", async () => {
    const id = `${postsRoot}/2026-04-02-empty-body.md`;
    await expect(
      transformMarkdown("---\ntitle: t\nsummary: s\n---\n\n   \n", id),
    ).rejects.toThrow(/empty-body\.md: post body is empty/);
  });

  it("still validates empty body when only ?meta is requested", async () => {
    const id = `${postsRoot}/2026-04-02-empty-body.md?meta`;
    await expect(
      transformMarkdown("---\ntitle: t\nsummary: s\n---\n\n   \n", id),
    ).rejects.toThrow(/empty-body\.md: post body is empty/);
  });

  it("still validates empty body when only ?html is requested", async () => {
    const id = `${postsRoot}/2026-04-02-empty-body.md?html`;
    await expect(
      transformMarkdown("---\ntitle: t\nsummary: s\n---\n\n   \n", id),
    ).rejects.toThrow(/empty-body\.md: post body is empty/);
  });

  it("ignores markdown outside content/posts", async () => {
    const result = await transformMarkdown("# docs\n", "/repo/docs/SPEC.md");
    expect(result).toBeNull();
  });

  it("ignores non-markdown modules", async () => {
    const result = await transformMarkdown(
      "export {}",
      `${postsRoot}/2026-04-02-hello.ts`,
    );
    expect(result).toBeNull();
  });
});

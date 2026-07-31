import { describe, expect, it } from "vitest";

import {
  groupPostsByYear,
  parsePostFilename,
  postFrontmatterSchema,
  selectPublishedPosts,
  sortPosts,
  type PostMeta,
} from "../postMeta";

function post(
  partial: Partial<PostMeta> & Pick<PostMeta, "date" | "slug">,
): PostMeta {
  return {
    title: partial.title ?? partial.slug,
    summary: partial.summary ?? "summary",
    draft: partial.draft ?? false,
    date: partial.date,
    slug: partial.slug,
  };
}

describe("parsePostFilename", () => {
  it("extracts date and slug from YYYY-MM-DD-{slug}.md", () => {
    expect(parsePostFilename("2026-04-02-hello-world.md")).toEqual({
      date: "2026-04-02",
      slug: "hello-world",
    });
  });

  it("allows a single-segment slug", () => {
    expect(parsePostFilename("2025-12-01-a.md")).toEqual({
      date: "2025-12-01",
      slug: "a",
    });
  });

  it("keeps multi-hyphen and dotted segments inside the slug", () => {
    expect(parsePostFilename("2026-07-29-building-this-site.md")).toEqual({
      date: "2026-07-29",
      slug: "building-this-site",
    });
    expect(parsePostFilename("2026-01-01-v1.2-release.md")).toEqual({
      date: "2026-01-01",
      slug: "v1.2-release",
    });
  });

  it("throws when the filename does not match the pattern", () => {
    expect(() => parsePostFilename("hello-world.md")).toThrow(
      /hello-world\.md/,
    );
    expect(() => parsePostFilename("2026-04-02.md")).toThrow(/2026-04-02\.md/);
    expect(() => parsePostFilename("26-04-02-slug.md")).toThrow(
      /26-04-02-slug\.md/,
    );
  });

  it("throws when the slug segment is empty or the extension is wrong", () => {
    expect(() => parsePostFilename("2026-04-02-.md")).toThrow(
      /2026-04-02-\.md/,
    );
    expect(() => parsePostFilename("2026-04-02-slug.txt")).toThrow(
      /2026-04-02-slug\.txt/,
    );
    expect(() => parsePostFilename("")).toThrow(
      /expected YYYY-MM-DD-\{slug\}\.md/,
    );
  });
});

describe("postFrontmatterSchema", () => {
  it("accepts title and summary and defaults draft to false", () => {
    const result = postFrontmatterSchema.safeParse({
      title: "제목",
      summary: "요약",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: "제목",
        summary: "요약",
        draft: false,
      });
    }
  });

  it("accepts draft: true", () => {
    const result = postFrontmatterSchema.safeParse({
      title: "제목",
      summary: "요약",
      draft: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.draft).toBe(true);
    }
  });

  it("accepts an explicit draft: false", () => {
    const result = postFrontmatterSchema.safeParse({
      title: "제목",
      summary: "요약",
      draft: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.draft).toBe(false);
    }
  });

  it("strips unknown keys such as date and slug from frontmatter", () => {
    const result = postFrontmatterSchema.safeParse({
      title: "제목",
      summary: "요약",
      date: "2000-01-01",
      slug: "from-frontmatter",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: "제목",
        summary: "요약",
        draft: false,
      });
      expect(result.data).not.toHaveProperty("date");
      expect(result.data).not.toHaveProperty("slug");
    }
  });

  it("rejects missing required fields and empty strings", () => {
    expect(postFrontmatterSchema.safeParse({ summary: "s" }).success).toBe(
      false,
    );
    expect(postFrontmatterSchema.safeParse({ title: "t" }).success).toBe(false);
    expect(
      postFrontmatterSchema.safeParse({ title: "", summary: "s" }).success,
    ).toBe(false);
    expect(
      postFrontmatterSchema.safeParse({ title: "t", summary: "" }).success,
    ).toBe(false);
  });

  it("rejects non-string title/summary and non-boolean draft", () => {
    expect(
      postFrontmatterSchema.safeParse({ title: 1, summary: "s" }).success,
    ).toBe(false);
    expect(
      postFrontmatterSchema.safeParse({ title: "t", summary: 1 }).success,
    ).toBe(false);
    expect(
      postFrontmatterSchema.safeParse({
        title: "t",
        summary: "s",
        draft: "true",
      }).success,
    ).toBe(false);
    expect(
      postFrontmatterSchema.safeParse({
        title: "t",
        summary: "s",
        draft: 1,
      }).success,
    ).toBe(false);
  });
});

describe("sortPosts", () => {
  it("orders by date descending", () => {
    const sorted = sortPosts([
      post({ date: "2024-01-01", slug: "a" }),
      post({ date: "2026-06-14", slug: "b" }),
      post({ date: "2025-03-03", slug: "c" }),
    ]);
    expect(sorted.map((p) => p.slug)).toEqual(["b", "c", "a"]);
  });

  it("breaks same-date ties by slug ascending", () => {
    const sorted = sortPosts([
      post({ date: "2026-04-02", slug: "zeta" }),
      post({ date: "2026-04-02", slug: "alpha" }),
      post({ date: "2026-04-02", slug: "mu" }),
    ]);
    expect(sorted.map((p) => p.slug)).toEqual(["alpha", "mu", "zeta"]);
  });

  it("is stable when date and slug both match", () => {
    const a = post({ date: "2026-04-02", slug: "same", title: "first" });
    const b = post({ date: "2026-04-02", slug: "same", title: "second" });
    const sorted = sortPosts([a, b]);
    expect(sorted.map((p) => p.title)).toEqual(["first", "second"]);
  });

  it("returns an empty array and a single-element array unchanged in order", () => {
    expect(sortPosts([])).toEqual([]);
    const only = post({ date: "2026-01-01", slug: "only" });
    expect(sortPosts([only])).toEqual([only]);
  });

  it("does not mutate the input array or its entries", () => {
    const input = [
      post({ date: "2024-01-01", slug: "a" }),
      post({ date: "2026-06-14", slug: "b" }),
    ];
    const snapshot = input.map((p) => ({ ...p }));
    const sorted = sortPosts(input);
    expect(input.map((p) => p.slug)).toEqual(["a", "b"]);
    expect(input).toEqual(snapshot);
    expect(sorted.map((p) => p.slug)).toEqual(["b", "a"]);
    expect(sorted).not.toBe(input);
  });

  it("does not filter drafts", () => {
    const sorted = sortPosts([
      post({ date: "2024-01-01", slug: "old", draft: false }),
      post({ date: "2026-06-14", slug: "drafty", draft: true }),
    ]);
    expect(sorted.map((p) => p.slug)).toEqual(["drafty", "old"]);
  });
});

describe("groupPostsByYear", () => {
  it("groups by year descending with date-desc posts inside each year", () => {
    const groups = groupPostsByYear([
      post({ date: "2024-05-01", slug: "old" }),
      post({ date: "2026-01-10", slug: "new-a" }),
      post({ date: "2026-06-14", slug: "new-b" }),
      post({ date: "2025-12-01", slug: "mid" }),
    ]);
    expect(groups.map((g) => g.year)).toEqual(["2026", "2025", "2024"]);
    expect(groups[0]?.posts.map((p) => p.slug)).toEqual(["new-b", "new-a"]);
    expect(groups[1]?.posts.map((p) => p.slug)).toEqual(["mid"]);
    expect(groups[2]?.posts.map((p) => p.slug)).toEqual(["old"]);
  });

  it("sorts same-date posts by slug ascending within a year group", () => {
    const groups = groupPostsByYear([
      post({ date: "2026-04-02", slug: "zeta" }),
      post({ date: "2026-04-02", slug: "alpha" }),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.posts.map((p) => p.slug)).toEqual(["alpha", "zeta"]);
  });

  it("is stable on full date+slug ties within a year group", () => {
    const first = post({
      date: "2026-04-02",
      slug: "same",
      title: "first",
    });
    const second = post({
      date: "2026-04-02",
      slug: "same",
      title: "second",
    });
    const groups = groupPostsByYear([first, second]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.posts.map((p) => p.title)).toEqual(["first", "second"]);
  });

  it("returns an empty list for empty input", () => {
    expect(groupPostsByYear([])).toEqual([]);
  });

  it("does not drop drafts; callers filter before grouping", () => {
    const groups = groupPostsByYear([
      post({ date: "2026-01-01", slug: "pub", draft: false }),
      post({ date: "2025-06-01", slug: "drafty", draft: true }),
    ]);
    expect(groups.map((g) => g.year)).toEqual(["2026", "2025"]);
    expect(groups[1]?.posts.map((p) => p.slug)).toEqual(["drafty"]);
  });
});

describe("selectPublishedPosts", () => {
  it("drops draft posts and returns the rest sorted", () => {
    const published = selectPublishedPosts([
      post({ date: "2024-01-01", slug: "old", draft: false }),
      post({ date: "2026-06-14", slug: "drafty", draft: true }),
      post({ date: "2025-03-03", slug: "mid", draft: false }),
    ]);
    expect(published.map((p) => p.slug)).toEqual(["mid", "old"]);
  });

  it("returns an empty array when every post is a draft", () => {
    expect(
      selectPublishedPosts([
        post({ date: "2026-01-01", slug: "a", draft: true }),
        post({ date: "2025-01-01", slug: "b", draft: true }),
      ]),
    ).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(selectPublishedPosts([])).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const input = [
      post({ date: "2024-01-01", slug: "old", draft: false }),
      post({ date: "2026-06-14", slug: "drafty", draft: true }),
    ];
    const snapshot = input.map((p) => ({ ...p }));
    selectPublishedPosts(input);
    expect(input).toEqual(snapshot);
    expect(input.map((p) => p.slug)).toEqual(["old", "drafty"]);
  });
});

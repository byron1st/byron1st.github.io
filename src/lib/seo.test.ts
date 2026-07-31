import { describe, expect, it } from "vitest";

import { buildPageMeta } from "./seo";
import { SITE_TITLE, SITE_URL } from "./site";

describe("buildPageMeta", () => {
  it("uses bare site title on the home page (no em dash)", () => {
    const meta = buildPageMeta({
      description: "tagline",
      path: "/",
    });

    expect(meta).toContainEqual({ title: SITE_TITLE });
    const titleEntry = meta.find(
      (entry): entry is { title: string } => "title" in entry,
    );
    expect(titleEntry?.title).toBe(SITE_TITLE);
    expect(titleEntry?.title.includes("—")).toBe(false);
  });

  it("formats subpage titles as '{page} — {name}'", () => {
    const meta = buildPageMeta({
      title: "About",
      description: "about text",
      path: "/about",
    });

    expect(meta).toContainEqual({ title: `About — ${SITE_TITLE}` });
  });

  it("emits a link canonical descriptor with SITE_URL-based href", () => {
    const meta = buildPageMeta({
      title: "Posts",
      description: "posts",
      path: "/posts",
    });

    expect(meta).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: `${SITE_URL}/posts`,
    });
  });

  it("sets og:url from SITE_URL and path", () => {
    const meta = buildPageMeta({
      title: "Building",
      description: "summary",
      path: "/posts/building-this-site",
      ogType: "article",
    });

    expect(meta).toContainEqual({
      property: "og:url",
      content: `${SITE_URL}/posts/building-this-site`,
    });
    expect(meta).toContainEqual({
      property: "og:type",
      content: "article",
    });
  });

  it("includes description, og title/description, and twitter:card", () => {
    const meta = buildPageMeta({
      title: "Projects",
      description: "project intro",
      path: "/projects",
    });

    expect(meta).toContainEqual({
      name: "description",
      content: "project intro",
    });
    expect(meta).toContainEqual({
      property: "og:title",
      content: `Projects — ${SITE_TITLE}`,
    });
    expect(meta).toContainEqual({
      property: "og:description",
      content: "project intro",
    });
    expect(meta).toContainEqual({
      name: "twitter:card",
      content: "summary",
    });
  });

  it("does not emit og:image", () => {
    const meta = buildPageMeta({
      description: "tagline",
      path: "/",
    });

    expect(
      meta.some(
        (entry) => "property" in entry && entry.property === "og:image",
      ),
    ).toBe(false);
  });

  it("uses SITE_URL itself as the home canonical and og:url", () => {
    const meta = buildPageMeta({
      description: "tagline",
      path: "/",
    });

    expect(meta).toContainEqual({
      tagName: "link",
      rel: "canonical",
      href: SITE_URL,
    });
    expect(meta).toContainEqual({
      property: "og:url",
      content: SITE_URL,
    });
  });
});

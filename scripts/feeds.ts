import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { SITE_TITLE, SITE_URL } from "../src/lib/site";
import { readPostFiles } from "./postFiles";

const RSS_LIMIT = 20;

/** Absolute URL for a site path. Home is SITE_URL with no trailing slash. */
function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Expand framework static routes with published post detail paths. */
export function withPostPaths(staticPaths: string[]): string[] {
  return [
    ...staticPaths,
    ...readPostFiles().map((post) => `/posts/${post.slug}`),
  ];
}

function buildRssXml(): { xml: string; itemCount: number } {
  const posts = readPostFiles().slice(0, RSS_LIMIT);
  const items = posts
    .map((post) => {
      const link = absoluteUrl(`/posts/${post.slug}`);
      const pubDate = new Date(`${post.date}T00:00:00.000Z`).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${escapeXml(post.summary)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${escapeXml(SITE_TITLE)}</title>`,
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <description>${escapeXml(`${SITE_TITLE} — posts`)}</description>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return { xml, itemCount: posts.length };
}

function buildSitemapXml(paths: string[]): string {
  const urls = paths
    .map((path) => {
      const loc = absoluteUrl(path);
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ].join("\n");
}

function buildRobotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

/**
 * Write rss.xml, sitemap.xml, and robots.txt under `{buildDirectory}/client`.
 * `paths` must be the same array `prerender()` returned.
 */
export function writeFeeds({
  buildDirectory,
  paths,
}: {
  buildDirectory: string;
  paths: string[];
}): void {
  const clientDir = join(buildDirectory, "client");
  const { xml: rssXml, itemCount } = buildRssXml();
  const sitemapXml = buildSitemapXml(paths);
  const robotsTxt = buildRobotsTxt();

  writeFileSync(join(clientDir, "rss.xml"), rssXml, "utf8");
  writeFileSync(join(clientDir, "sitemap.xml"), sitemapXml, "utf8");
  writeFileSync(join(clientDir, "robots.txt"), robotsTxt, "utf8");

  console.log(
    `feeds: rss=${itemCount} items, sitemap=${paths.length} urls, robots.txt`,
  );
}

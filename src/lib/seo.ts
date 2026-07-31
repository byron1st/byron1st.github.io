import type { MetaDescriptor } from "react-router";

import { SITE_TITLE, SITE_URL } from "./site";

export type PageMetaInput = {
  /** Page title segment. Omit on the home page so the document title is bare SITE_TITLE. */
  title?: string;
  description: string;
  /** Route path starting with `/` (home is `/`). */
  path: string;
  /** Open Graph type. Defaults to `website`; post detail uses `article`. */
  ogType?: string;
};

function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/** Pure meta-descriptor builder for route `meta` exports. Not a React component. */
export function buildPageMeta({
  title,
  description,
  path,
  ogType = "website",
}: PageMetaInput): MetaDescriptor[] {
  const fullTitle =
    title === undefined ? SITE_TITLE : `${title} — ${SITE_TITLE}`;
  const url = absoluteUrl(path);

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary" },
    { tagName: "link", rel: "canonical", href: url },
  ];
}

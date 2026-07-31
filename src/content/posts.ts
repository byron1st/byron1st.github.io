import {
  parsePostFilename,
  selectPublishedPosts,
  type PostMeta,
} from "./postMeta";

// Distinct module IDs (?meta / ?html) so eager meta does not pin the html module
// into the same chunk (avoids Rollup INEFFECTIVE_DYNAMIC_IMPORT).
const metaModules: Record<string, PostMeta> = import.meta.glob(
  "../../content/posts/*.md",
  {
    eager: true,
    query: "?meta",
    import: "meta",
  },
);

const bodyModules: Record<string, () => Promise<string>> = import.meta.glob(
  "../../content/posts/*.md",
  {
    query: "?html",
    import: "html",
  },
) as Record<string, () => Promise<string>>;

/** Published posts only, sorted. Drafts never appear here. */
export const posts: PostMeta[] = selectPublishedPosts(
  Object.values(metaModules),
);

export async function loadPostBody(slug: string): Promise<string> {
  // Published set is the only loadable set — draft slugs fail the same as missing.
  if (!posts.some((post) => post.slug === slug)) {
    throw new Error(`Post not found for slug "${slug}"`);
  }

  for (const [path, load] of Object.entries(bodyModules)) {
    const fileName = path.split("/").pop() ?? path;
    const { slug: fileSlug } = parsePostFilename(fileName);
    if (fileSlug === slug) {
      return load();
    }
  }
  throw new Error(`Post not found for slug "${slug}"`);
}

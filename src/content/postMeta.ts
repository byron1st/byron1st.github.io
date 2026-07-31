import { z } from "zod";

export const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  draft: z.boolean().default(false),
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export type PostMeta = PostFrontmatter & {
  date: string;
  slug: string;
};

const POST_FILENAME = /^(\d{4}-\d{2}-\d{2})-(.+)\.md$/;

/** Derive date and slug from `YYYY-MM-DD-{slug}.md`. Never read them from frontmatter. */
export function parsePostFilename(filename: string): {
  date: string;
  slug: string;
} {
  const match = POST_FILENAME.exec(filename);
  if (!match) {
    throw new Error(
      `Invalid post filename "${filename}"; expected YYYY-MM-DD-{slug}.md`,
    );
  }
  return { date: match[1]!, slug: match[2]! };
}

/** Date descending, same-date slug ascending, stable on full ties. */
export function sortPosts(posts: PostMeta[]): PostMeta[] {
  return posts
    .map((post, index) => ({ post, index }))
    .sort((a, b) => {
      if (a.post.date !== b.post.date) {
        return a.post.date < b.post.date ? 1 : -1;
      }
      if (a.post.slug !== b.post.slug) {
        return a.post.slug < b.post.slug ? -1 : 1;
      }
      return a.index - b.index;
    })
    .map(({ post }) => post);
}

/** Drop drafts, then sort. Single filter+sort path for both adapters. */
export function selectPublishedPosts(posts: PostMeta[]): PostMeta[] {
  return sortPosts(posts.filter((post) => !post.draft));
}

/** Year descending; within each year, posts keep sortPosts order. */
export function groupPostsByYear(
  posts: PostMeta[],
): { year: string; posts: PostMeta[] }[] {
  const groups = new Map<string, PostMeta[]>();
  for (const post of sortPosts(posts)) {
    const year = post.date.slice(0, 4);
    const bucket = groups.get(year);
    if (bucket) {
      bucket.push(post);
    } else {
      groups.set(year, [post]);
    }
  }
  return [...groups.entries()].map(([year, yearPosts]) => ({
    year,
    posts: yearPosts,
  }));
}

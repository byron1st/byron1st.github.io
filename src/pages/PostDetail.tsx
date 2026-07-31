import { Link } from "react-router";

import { PostBody } from "../components/PostBody";
import { loadPostBody, posts } from "../content/posts";
import type { PostMeta } from "../content/postMeta";
import { formatIsoDate } from "../lib/date";
import { buildPageMeta } from "../lib/seo";

// Manual types — this module is swapped out of the route tree when there are
// zero published posts (see routes.ts), so generated `./+types/PostDetail`
// may not exist during typecheck.
type LoaderArgs = { params: { slug?: string } };
type LoaderData = { post: PostMeta; html: string };

export async function loader({ params }: LoaderArgs): Promise<LoaderData> {
  const { slug } = params;
  const post = posts.find((entry) => entry.slug === slug);
  if (!post || !slug) {
    // Unknown/draft slugs are not prerendered; SPA hits fall to the default error UI.
    throw new Error(`Post not found for slug "${slug ?? ""}"`);
  }
  const html = await loadPostBody(slug);
  return { post, html };
}

export function meta({ data }: { data?: LoaderData }) {
  if (!data) {
    return [];
  }
  const { post } = data;
  return buildPageMeta({
    title: post.title,
    description: post.summary,
    path: `/posts/${post.slug}`,
    ogType: "article",
  });
}

export default function PostDetail({ loaderData }: { loaderData: LoaderData }) {
  const { post, html } = loaderData;

  return (
    <div className="pt-14 flex flex-col gap-7">
      <Link to="/posts" className="text-xs text-faint hover:text-fg">
        ← back to posts
      </Link>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-2xl font-semibold tracking-tight max-w-md">
          {post.title}
        </h1>
        <p className="text-xs text-faint">{formatIsoDate(post.date)}</p>
      </div>
      <PostBody html={html} />
    </div>
  );
}

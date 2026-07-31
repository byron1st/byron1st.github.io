import { Link } from "react-router";

import type { Route } from "./+types/PostDetail";
import { PostBody } from "../components/PostBody";
import { loadPostBody, posts } from "../content/posts";
import { formatIsoDate } from "../lib/date";

export async function loader({ params }: Route.LoaderArgs) {
  const { slug } = params;
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) {
    // Unknown/draft slugs are not prerendered; SPA hits fall to the default error UI.
    throw new Error(`Post not found for slug "${slug}"`);
  }
  const html = await loadPostBody(slug);
  return { post, html };
}

export default function PostDetail({ loaderData }: Route.ComponentProps) {
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

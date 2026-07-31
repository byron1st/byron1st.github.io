import { Link, useParams } from "react-router";

import { buildPageMeta } from "../lib/seo";

/**
 * Used when there are zero published posts. With `ssr: false`, a route that is
 * never prerendered cannot export `loader` — so this module has none.
 */
export function meta() {
  return buildPageMeta({
    title: "Not found",
    description: "This post is not available.",
    path: "/posts",
  });
}

export default function PostDetailEmpty() {
  const { slug } = useParams();

  return (
    <div className="pt-14 flex flex-col gap-7">
      <Link to="/posts" className="text-xs text-faint hover:text-fg">
        ← back to posts
      </Link>
      <p className="text-base text-muted">
        {slug ? `Post not found: ${slug}` : "Post not found."}
      </p>
    </div>
  );
}

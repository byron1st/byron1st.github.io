import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

import { readPostFiles } from "../scripts/postFiles";

// With ssr:false, a route that is never prerendered cannot export `loader`.
// When every post is draft (or the folder is empty), PostDetail would not be
// in the prerender set — swap in a loader-free module so the build still works.
// Use the Node adapter (not import.meta.glob) so route config does not need the
// Vite markdown transform.
const hasPublishedPosts = readPostFiles().length > 0;
const postDetail = route(
  "posts/:slug",
  hasPublishedPosts ? "pages/PostDetail.tsx" : "pages/PostDetailEmpty.tsx",
);

export default [
  layout("components/Layout.tsx", [
    index("pages/Home.tsx"),
    route("about", "pages/About.tsx"),
    route("projects", "pages/Projects.tsx"),
    route("posts", "pages/Posts.tsx"),
    postDetail,
  ]),
] satisfies RouteConfig;

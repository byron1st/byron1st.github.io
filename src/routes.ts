import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [
    index("pages/Home.tsx"),
    route("about", "pages/About.tsx"),
    route("projects", "pages/Projects.tsx"),
    route("posts", "pages/Posts.tsx"),
    route("posts/:slug", "pages/PostDetail.tsx"),
  ]),
] satisfies RouteConfig;

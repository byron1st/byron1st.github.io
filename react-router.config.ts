import type { Config } from "@react-router/dev/config";

import { readPostFiles } from "./scripts/postFiles";

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender({ getStaticPaths }) {
    const staticPaths = getStaticPaths();
    const postPaths = readPostFiles().map((post) => `/posts/${post.slug}`);
    return [...staticPaths, ...postPaths];
  },
} satisfies Config;

import type { Config } from "@react-router/dev/config";

import { withPostPaths, writeFeeds } from "./scripts/feeds";

// Same path list prerender returns — buildEnd reuses it for sitemap (AC-3).
let sitePaths: string[] = [];

export default {
  appDirectory: "src",
  buildDirectory: "dist",
  ssr: false,
  prerender({ getStaticPaths }) {
    sitePaths = withPostPaths(getStaticPaths());
    return sitePaths;
  },
  buildEnd({ reactRouterConfig }) {
    writeFeeds({
      buildDirectory: reactRouterConfig.buildDirectory,
      paths: sitePaths,
    });
  },
} satisfies Config;

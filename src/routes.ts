import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout } from "@react-router/dev/routes";

export default [
  layout("components/Layout.tsx", [index("pages/Home.tsx")]),
] satisfies RouteConfig;

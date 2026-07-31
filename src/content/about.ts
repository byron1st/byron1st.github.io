import { z } from "zod";

import raw from "../../content/about.yaml";
import { aboutSchema, type About } from "./schema";

const parsed = aboutSchema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `content/about.yaml 검증 실패:\n${z.prettifyError(parsed.error)}`,
  );
}

export const about: About = parsed.data;

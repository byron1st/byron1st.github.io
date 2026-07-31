import { z } from "zod";

import raw from "../../content/profile.yaml";
import { profileSchema, type Profile } from "./schema";

const parsed = profileSchema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `content/profile.yaml 검증 실패:\n${z.prettifyError(parsed.error)}`,
  );
}

export const profile: Profile = parsed.data;

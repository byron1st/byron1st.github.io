import { z } from "zod";

import raw from "../../content/projects.yaml";
import { projectsSchema, type Projects } from "./schema";

const parsed = projectsSchema.safeParse(raw);
if (!parsed.success) {
  throw new Error(
    `content/projects.yaml 검증 실패:\n${z.prettifyError(parsed.error)}`,
  );
}

export const projects: Projects = parsed.data;

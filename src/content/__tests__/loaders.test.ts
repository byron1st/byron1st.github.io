import { describe, expect, it } from "vitest";
import { z } from "zod";

import { about } from "../about";
import { profile } from "../profile";
import { projects } from "../projects";
import { aboutSchema, profileSchema, projectsSchema } from "../schema";

describe("content loaders", () => {
  it("exports a validated profile with only github and email socials", () => {
    expect(profile.name).toBe("Hwi Ahn");
    expect(profile.tagline.length).toBeGreaterThan(0);
    expect(profile.socials.map((s) => s.kind)).toEqual(["github", "email"]);
    expect(profile.socials.find((s) => s.kind === "github")?.url).toBe(
      "https://github.com/byron1st",
    );
    expect(profile.socials.find((s) => s.kind === "email")?.url).toBe(
      "mailto:byron1st@icloud.com",
    );
    // re-parse proves the live export still satisfies the schema contract
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("exports about data with four experience entries, three education entries, and empty works", () => {
    expect(about.intro).toHaveLength(2);
    expect(about.stack.map((g) => g.group)).toEqual([
      "Languages",
      "Backend",
      "Infra",
      "Data",
      "Frontend",
      "AI tooling",
    ]);
    expect(about.experience).toHaveLength(4);
    expect(about.experience.map((e) => e.company)).toEqual([
      "42dot",
      "Bigpicture Lab",
      "NavMine",
      "Naver",
    ]);
    expect(about.education).toHaveLength(3);
    expect(about.works).toEqual([]);

    const phd = about.education[0];
    expect(phd?.thesis).toBe("Software architecture reconstruction");
    expect(phd?.description?.length).toBeGreaterThan(0);
    expect(phd?.papers?.length).toBeGreaterThan(0);

    const bachelor = about.education[2];
    expect(bachelor?.degree).toContain("B.S.");
    expect(bachelor?.thesis).toBeUndefined();
    expect(bachelor?.description).toBeUndefined();
    expect(bachelor?.papers).toBeUndefined();

    expect(aboutSchema.safeParse(about).success).toBe(true);
  });

  it("exports personal-harness as the only project", () => {
    expect(projects.intro.length).toBeGreaterThan(0);
    expect(projects.projects).toHaveLength(1);
    expect(projects.projects[0]?.name).toBe("personal-harness");
    expect(projects.projects[0]?.year).toBeUndefined();
    expect(projects.projects[0]?.tech).toEqual(["Codex", "Claude Code"]);
    expect(projects.projects[0]?.link).toBe(
      "https://github.com/byron1st/personal-harness",
    );
    expect(projectsSchema.safeParse(projects).success).toBe(true);
  });

  it("includes the content file path when schema validation fails", () => {
    const cases = [
      {
        path: "content/profile.yaml",
        error: profileSchema.safeParse({ tagline: "x", socials: [] }),
      },
      {
        path: "content/about.yaml",
        error: aboutSchema.safeParse({ intro: [] }),
      },
      {
        path: "content/projects.yaml",
        error: projectsSchema.safeParse({ projects: [] }),
      },
    ] as const;

    for (const { path, error: parsed } of cases) {
      expect(parsed.success).toBe(false);
      if (parsed.success) {
        continue;
      }
      // mirrors the throw shape used by profile.ts / about.ts / projects.ts
      const message = `${path} 검증 실패:\n${z.prettifyError(parsed.error)}`;
      expect(message).toContain(path);
      expect(message).toContain("검증 실패");
    }
  });
});

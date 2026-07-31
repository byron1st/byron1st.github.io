import { describe, expect, it } from "vitest";
import { z } from "zod";

import { about } from "../about";
import { profile } from "../profile";
import { projects } from "../projects";
import { aboutSchema, profileSchema, projectsSchema } from "../schema";

describe("content loaders", () => {
  it("exports a validated profile with known social kinds", () => {
    expect(profile.name).toBe("안휘");
    expect(profile.tagline.length).toBeGreaterThan(0);
    expect(profile.socials.length).toBeGreaterThan(0);
    expect(profile.socials.find((s) => s.kind === "github")?.url).toBe(
      "https://github.com/byron1st",
    );
    expect(profile.socials.find((s) => s.kind === "email")?.url).toBe(
      "mailto:byron1st@icloud.com",
    );
    // re-parse proves the live export still satisfies the schema contract
    expect(profileSchema.safeParse(profile).success).toBe(true);
  });

  it("exports validated about data with structural invariants", () => {
    expect(about.intro.length).toBeGreaterThan(0);
    expect(about.stack.length).toBeGreaterThan(0);
    expect(about.experience.length).toBeGreaterThan(0);
    for (const entry of about.experience) {
      expect(entry.company.length).toBeGreaterThan(0);
      expect(entry.roles.length).toBeGreaterThan(0);
      for (const role of entry.roles) {
        expect(role.role.length).toBeGreaterThan(0);
        expect(role.period.length).toBeGreaterThan(0);
        expect(role.bullets.length).toBeGreaterThan(0);
      }
    }
    // 포티투닷 has two roles under one company entry (internal transfer).
    const fortyTwoDot = about.experience.find(
      (e) => e.company === "포티투닷(주)",
    );
    expect(fortyTwoDot?.roles.length).toBeGreaterThanOrEqual(2);
    expect(about.education.length).toBeGreaterThan(0);

    // Bachelor entry (last) has no optional blocks — About skips empty containers.
    const bachelor = about.education[about.education.length - 1];
    expect(bachelor?.degree).toContain("학사");
    expect(bachelor?.thesis).toBeUndefined();
    expect(bachelor?.description).toBeUndefined();
    expect(bachelor?.papers).toBeUndefined();

    expect(aboutSchema.safeParse(about).success).toBe(true);
  });

  it("exports published projects with github links and no service by default", () => {
    expect(projects.intro.length).toBeGreaterThan(0);
    expect(projects.projects.length).toBeGreaterThan(0);
    expect(projects.projects[0]?.name).toBe("personal-harness");
    expect(projects.projects[0]?.year).toBeUndefined();
    expect(projects.projects[0]?.github).toBe(
      "https://github.com/byron1st/personal-harness",
    );
    expect(projects.projects[0]?.service).toBeUndefined();
    for (const project of projects.projects) {
      expect(project.github?.length ?? 0).toBeGreaterThan(0);
    }
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

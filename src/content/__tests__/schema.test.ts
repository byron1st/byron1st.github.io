import { describe, expect, it } from "vitest";

import { aboutSchema, profileSchema, projectsSchema } from "../schema";

const validProfile = {
  name: "Hwi Ahn",
  tagline: "Backend engineer building secure, high-performance systems.",
  socials: [
    { kind: "github", url: "https://github.com/byron1st" },
    { kind: "email", url: "mailto:byron1st@icloud.com" },
  ],
};

const bachelorEntry = {
  school: "KAIST",
  degree: "B.S. in Computer Science",
  period: "2005 — 2010",
};

const validAbout = {
  intro: ["Paragraph one.", "Paragraph two."],
  stack: [{ group: "Languages", items: ["Go", "TypeScript"] }],
  experience: [
    {
      company: "42dot",
      roles: [
        {
          role: "Sr. Security Engineer",
          period: "2024.01 — present",
          bullets: ["Built a security platform."],
        },
      ],
    },
  ],
  education: [bachelorEntry],
  works: [],
};

const projectWithoutLink = {
  name: "scratch",
  year: "2024",
  description: "A private experiment.",
  tech: [],
};

const validProjects = {
  intro: "Open-source side projects.",
  projects: [projectWithoutLink],
};

describe("profileSchema", () => {
  it("accepts a valid profile with known social kinds", () => {
    const result = profileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("accepts every social kind in the enum", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      socials: [
        { kind: "github", url: "https://github.com/example" },
        { kind: "x", url: "https://x.com/example" },
        { kind: "linkedin", url: "https://linkedin.com/in/example" },
        { kind: "email", url: "mailto:example@example.com" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty socials array", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      socials: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing required field", () => {
    const withoutName = {
      tagline: validProfile.tagline,
      socials: validProfile.socials,
    };
    const result = profileSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it("rejects empty strings for required string fields", () => {
    expect(profileSchema.safeParse({ ...validProfile, name: "" }).success).toBe(
      false,
    );
    expect(
      profileSchema.safeParse({ ...validProfile, tagline: "" }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({
        ...validProfile,
        socials: [{ kind: "github", url: "" }],
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown social kind", () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      socials: [{ kind: "mastodon", url: "https://example.com" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("aboutSchema", () => {
  it("accepts a bachelor entry without thesis, description, or papers", () => {
    const result = aboutSchema.safeParse(validAbout);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.education[0]).toEqual(bachelorEntry);
      expect(result.data.works).toEqual([]);
    }
  });

  it("accepts education with optional thesis, description, and papers", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      education: [
        {
          ...bachelorEntry,
          thesis: "Software architecture reconstruction",
          description:
            "Reconstructing execution architecture from code and logs.",
          papers: ["Paper A", "Paper B"],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty works array", () => {
    const result = aboutSchema.safeParse(validAbout);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.works).toEqual([]);
    }
  });

  it("defaults works to an empty array when the field is omitted", () => {
    const withoutWorks = {
      intro: validAbout.intro,
      stack: validAbout.stack,
      experience: validAbout.experience,
      education: validAbout.education,
    };
    const result = aboutSchema.safeParse(withoutWorks);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.works).toEqual([]);
    }
  });

  it("accepts a non-empty works entry", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      works: [
        {
          title: "Designing Data-Intensive Applications",
          year: "2017",
          meta: "Book",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.works).toHaveLength(1);
      expect(result.data.works[0]?.title).toBe(
        "Designing Data-Intensive Applications",
      );
    }
  });

  it("rejects a missing required experience field", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      experience: [
        {
          company: "42dot",
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects experience with an empty roles array", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      experience: [{ company: "42dot", roles: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a company with multiple roles and optional overall period", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      experience: [
        {
          company: "42dot",
          period: "2024.01 — present",
          roles: [
            {
              role: "Sr. Security Engineer",
              period: "2025.07 — present",
              bullets: ["Built a security platform."],
            },
            {
              role: "Sr. Blockchain Engineer",
              period: "2024.01 — 2025.07",
              bullets: ["Built a blockchain PaaS."],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experience[0]?.period).toBe("2024.01 — present");
      expect(result.data.experience[0]?.roles).toHaveLength(2);
    }
  });

  // About only omits the bullet list container when bullets is []; the entry still renders.
  it("accepts experience with an empty bullets array", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      experience: [
        {
          company: "42dot",
          roles: [
            {
              role: "Sr. Security Engineer",
              period: "2024.01 — present",
              bullets: [],
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experience[0]?.roles[0]?.bullets).toEqual([]);
    }
  });

  // Empty papers array is valid data; About still skips the papers MarkerList when length is 0.
  it("accepts education with an empty papers array", () => {
    const result = aboutSchema.safeParse({
      ...validAbout,
      education: [{ ...bachelorEntry, papers: [] }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.education[0]?.papers).toEqual([]);
    }
  });

  it("rejects a works entry missing required fields", () => {
    expect(
      aboutSchema.safeParse({
        ...validAbout,
        works: [{ title: "Only a title" }],
      }).success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...validAbout,
        works: [{ title: "Book", year: "2017", meta: "" }],
      }).success,
    ).toBe(false);
  });

  it("rejects empty strings inside nested content arrays", () => {
    expect(
      aboutSchema.safeParse({
        ...validAbout,
        intro: [""],
      }).success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...validAbout,
        stack: [{ group: "Languages", items: [""] }],
      }).success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...validAbout,
        experience: [
          {
            company: "42dot",
            roles: [
              {
                role: "Engineer",
                period: "2024",
                bullets: [""],
              },
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      aboutSchema.safeParse({
        ...validAbout,
        education: [
          {
            ...bachelorEntry,
            papers: [""],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a missing top-level required field", () => {
    const withoutStack = {
      intro: validAbout.intro,
      experience: validAbout.experience,
      education: validAbout.education,
      works: validAbout.works,
    };
    expect(aboutSchema.safeParse(withoutStack).success).toBe(false);
  });
});

describe("projectsSchema", () => {
  it("accepts a project without github/service and with empty tech", () => {
    const result = projectsSchema.safeParse(validProjects);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects[0]?.github).toBeUndefined();
      expect(result.data.projects[0]?.service).toBeUndefined();
      expect(result.data.projects[0]?.tech).toEqual([]);
    }
  });

  it("accepts a project with github, service, and tech", () => {
    const result = projectsSchema.safeParse({
      intro: "Open-source side projects.",
      projects: [
        {
          name: "personal-harness",
          year: "2025",
          description: "Personal AI-agent development workflow harness.",
          tech: ["Codex", "Claude Code"],
          github: "https://github.com/byron1st/personal-harness",
          service: "https://example.com/harness",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects[0]?.github).toBe(
        "https://github.com/byron1st/personal-harness",
      );
      expect(result.data.projects[0]?.service).toBe(
        "https://example.com/harness",
      );
    }
  });

  it("accepts a project that omits optional year, github, service, and tech", () => {
    const result = projectsSchema.safeParse({
      intro: "Open-source side projects.",
      projects: [
        {
          name: "personal-harness",
          description: "A personal development-workflow harness.",
        },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projects[0]?.year).toBeUndefined();
      expect(result.data.projects[0]?.github).toBeUndefined();
      expect(result.data.projects[0]?.service).toBeUndefined();
      expect(result.data.projects[0]?.tech).toEqual([]);
    }
  });

  it("rejects a missing project name", () => {
    const result = projectsSchema.safeParse({
      intro: "x",
      projects: [{ description: "no name", tech: [] }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty intro or description strings", () => {
    expect(
      projectsSchema.safeParse({
        intro: "",
        projects: [projectWithoutLink],
      }).success,
    ).toBe(false);
    expect(
      projectsSchema.safeParse({
        intro: "x",
        projects: [{ name: "a", description: "", tech: [] }],
      }).success,
    ).toBe(false);
  });

  it("rejects empty tech item strings", () => {
    const result = projectsSchema.safeParse({
      intro: "x",
      projects: [
        {
          name: "a",
          description: "desc",
          tech: [""],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

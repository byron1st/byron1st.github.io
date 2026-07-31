import { z } from "zod";

export const socialKindSchema = z.enum(["github", "x", "linkedin", "email"]);

export const socialSchema = z.object({
  kind: socialKindSchema,
  url: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().min(1),
  socials: z.array(socialSchema),
});

export const stackGroupSchema = z.object({
  group: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const experienceRoleSchema = z.object({
  role: z.string().min(1),
  period: z.string().min(1),
  bullets: z.array(z.string().min(1)),
});

// One company entry can hold multiple roles (e.g. internal transfers).
// Optional `period` is the overall tenure shown on the company header when
// there are multiple roles; single-role entries use the role's own period.
export const experienceEntrySchema = z.object({
  company: z.string().min(1),
  period: z.string().min(1).optional(),
  roles: z.array(experienceRoleSchema).min(1),
});

export const educationEntrySchema = z.object({
  school: z.string().min(1),
  degree: z.string().min(1),
  period: z.string().min(1),
  thesis: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  papers: z.array(z.string().min(1)).optional(),
});

export const workEntrySchema = z.object({
  title: z.string().min(1),
  year: z.string().min(1),
  meta: z.string().min(1),
});

export const aboutSchema = z.object({
  intro: z.array(z.string().min(1)),
  stack: z.array(stackGroupSchema),
  experience: z.array(experienceEntrySchema),
  education: z.array(educationEntrySchema),
  // kept so authors can add books/courses later without a src/ change
  works: z.array(workEntrySchema).default([]),
});

export const projectEntrySchema = z.object({
  name: z.string().min(1),
  year: z.string().min(1).optional(),
  description: z.string().min(1),
  tech: z.array(z.string().min(1)).default([]),
  github: z.string().min(1).optional(),
  service: z.string().min(1).optional(),
});

export const projectsSchema = z.object({
  intro: z.string().min(1),
  projects: z.array(projectEntrySchema),
});

export type SocialKind = z.infer<typeof socialKindSchema>;
export type Social = z.infer<typeof socialSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type StackGroup = z.infer<typeof stackGroupSchema>;
export type ExperienceRole = z.infer<typeof experienceRoleSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type WorkEntry = z.infer<typeof workEntrySchema>;
export type About = z.infer<typeof aboutSchema>;
export type ProjectEntry = z.infer<typeof projectEntrySchema>;
export type Projects = z.infer<typeof projectsSchema>;

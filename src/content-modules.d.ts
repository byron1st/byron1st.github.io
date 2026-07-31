declare module "*.yaml" {
  const data: unknown;
  export default data;
}

declare module "*.yml" {
  const data: unknown;
  export default data;
}

type PostMetaModule = {
  title: string;
  summary: string;
  draft: boolean;
  date: string;
  slug: string;
};

declare module "*.md" {
  export const meta: PostMetaModule;
  export const html: string;
}

declare module "*.md?meta" {
  export const meta: PostMetaModule;
}

declare module "*.md?html" {
  export const html: string;
}

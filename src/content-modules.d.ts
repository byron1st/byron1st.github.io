declare module "*.yaml" {
  const data: unknown;
  export default data;
}

declare module "*.yml" {
  const data: unknown;
  export default data;
}

declare module "*.md" {
  export const meta: {
    title: string;
    summary: string;
    draft?: boolean;
  };
  export const html: string;
}

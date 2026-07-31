/// <reference types="vite/client" />

// Node 20.11+ exposes import.meta.dirname; no @types/node in this project.
interface ImportMeta {
  readonly dirname: string;
}

// ponytail: minimal node builtins for scripts/ + plugins; full @types/node if more surface is needed
declare module "node:fs" {
  export function readdirSync(path: string): string[];
  export function readFileSync(
    path: string,
    options: "utf8" | { encoding: "utf8" },
  ): string;
  export function writeFileSync(
    path: string,
    data: string,
    options?: "utf8" | { encoding: "utf8" },
  ): void;
}

declare module "node:path" {
  export function join(...paths: string[]): string;
  export function basename(path: string, suffix?: string): string;
}

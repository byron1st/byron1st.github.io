/// <reference types="vite/client" />

// Node 20.11+ exposes import.meta.dirname; no @types/node in this project.
interface ImportMeta {
  readonly dirname: string;
}

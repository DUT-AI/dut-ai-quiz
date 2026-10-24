import type { components, paths } from "./api.generated";

/**
 * Extract a component schema from FastAPI OpenAPI specification
 * Example: Schema<"GameSessionSnapshotOut">
 */
export type Schema<T extends keyof components["schemas"]> = components["schemas"][T];

/**
 * Central OpenAPI Paths definition
 */
export type ApiPaths = paths;

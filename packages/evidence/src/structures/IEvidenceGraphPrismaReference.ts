import type { EvidenceGraphPrismaSymbol } from "../typings/EvidenceGraphPrismaSymbol";

/**
 * A population of Prisma schema contracts that the owning claim must cite.
 *
 * Prisma is evidence-only: schema models cannot host `@evidence` declarations,
 * but TypeScript and Markdown claims can acknowledge the models, stored
 * columns, and relations they define.
 */
export interface IEvidenceGraphPrismaReference {
  /** Identifies the evidence artifacts as Prisma schemas. */
  type: "prisma";

  /** Project-relative glob patterns for one or more schema files. */
  files: string[];

  /**
   * Prisma unit kinds eligible to become evidence obligations.
   *
   * @default ["model", "column", "relation"]
   */
  symbol?: EvidenceGraphPrismaSymbol | EvidenceGraphPrismaSymbol[];
}

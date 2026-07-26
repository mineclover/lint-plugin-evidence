/** Versioned, producer-neutral artifact emitted by `evidence/graph`. */
export interface IEvidenceGraphResolvedIndex {
  version: 1;
  declarations: IEvidenceGraphResolvedDeclaration[];
}

/** One valid, resolved `@evidence` or `@evidenceExclude` declaration. */
export interface IEvidenceGraphResolvedDeclaration {
  id: string;
  tag: "evidence" | "evidenceExclude";
  target: string;
  reason: string;
  source: { file: string; line: number };
  hosts: IEvidenceGraphDeclarationHost[];
  resolvedTarget: IEvidenceGraphResolvedTarget;
}

/** A public TypeScript declaration that owns the evidence JSDoc. */
export interface IEvidenceGraphDeclarationHost {
  publicName: string;
  symbol: "type" | "function" | "property";
  declaration: { file: string; line: number };
}

/** The configured evidence unit selected by the declaration target. */
export interface IEvidenceGraphResolvedTarget {
  id: string;
  target: string;
  type: "markdown" | "prisma" | "swagger" | "typescript";
  symbol: string;
  source: { file: string; line: number };
}

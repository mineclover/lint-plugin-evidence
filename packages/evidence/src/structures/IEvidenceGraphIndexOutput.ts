/** Configures the optional resolved declaration index emitted by the lint rule. */
export interface IEvidenceGraphIndexOutput {
  /** Project-relative JSON destination. The lint rule writes atomically. */
  output: string;
}

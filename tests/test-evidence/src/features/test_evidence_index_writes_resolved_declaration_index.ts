import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  assertStatus,
  createProject,
  runCheck,
  type IEvidenceProject,
} from "../internal/index.ts";

/** Verifies the public hand-off preserves a resolved target and its TS host anchor. */
export const test_evidence_index_writes_resolved_declaration_index = (): void => {
  const project: IEvidenceProject = createProject({
    name: "resolved-index",
    lintConfig: [
      'import { evidence, type IEvidenceGraphConfig } from "@samchon/lint-plugin-evidence";',
      "",
      "const graph: IEvidenceGraphConfig = {",
      '  index: { output: ".graph/evidence-index.json" },',
      "  claims: [{",
      '    type: "typescript",',
      '    files: ["src/**/*.ts"],',
      '    symbol: "type",',
      '    reference: { type: "markdown", files: ["docs/spec.md"], symbol: "h2" },',
      "  }],",
      "};",
      "",
      "export default {",
      '  plugins: { "evidence": evidence },',
      '  rules: { "evidence/graph": ["error", graph] },',
      "};",
      "",
    ].join("\n"),
    files: {
      "docs/spec.md": "## Create order {#create-order}\n",
      "src/order.ts": [
        "/** @evidence docs/spec.md#create-order Owns the documented creation contract. */",
        "export interface ICreateOrder {}",
        "",
      ].join("\n"),
    },
  });
  try {
    const result = runCheck(project.directory);
    assertStatus(result, 0, "A complete graph should publish its resolved index.");
    const index = JSON.parse(
      fs.readFileSync(path.join(project.directory, ".graph", "evidence-index.json"), "utf8"),
    ) as {
      version: number;
      declarations: Array<{
        id: string;
        tag: string;
        target: string;
        reason: string;
        source: { file: string; line: number };
        hosts: Array<{ publicName: string; symbol: string; declaration: { file: string; line: number } }>;
        resolvedTarget: { id: string; target: string; type: string; symbol: string; source: { file: string; line: number } };
      }>;
    };
    assert.equal(index.version, 1);
    assert.deepEqual(index.declarations, [
      {
        id: "typescript:src/order.ts:1:1",
        tag: "evidence",
        target: "docs/spec.md#create-order",
        reason: "Owns the documented creation contract.",
        source: { file: "src/order.ts", line: 1 },
        hosts: [{ publicName: "ICreateOrder", symbol: "type", declaration: { file: "src/order.ts", line: 2 } }],
        resolvedTarget: {
          id: "markdown:docs/spec.md:h2:1",
          target: "docs/spec.md#create-order",
          type: "markdown",
          symbol: "h2",
          source: { file: "docs/spec.md", line: 1 },
        },
      },
    ]);
  } finally {
    project.cleanup();
  }
};

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  assertStatus,
  createProject,
  runCheck,
  type IEvidenceProject,
} from "../internal/index.ts";

/**
 * Verifies a Prisma reference is both accepted by the public configuration and
 * serialized as a Prisma target in the resolved declaration index.
 *
 * The native bridge can materialize Prisma units only after the configuration
 * reaches it. A unit test of either boundary alone would miss a public type
 * that rejects the valid config or an index type that lies about the emitted
 * artifact kind, so this drives the real linked contributor end to end.
 *
 * 1. Configure a TypeScript claim over one Prisma model and column population.
 * 2. Cite the aggregate model target from an exported TypeScript declaration.
 * 3. Assert the completed run writes a version-one Prisma resolved target.
 */
export const test_evidence_index_writes_prisma_resolved_target = (): void => {
  const project: IEvidenceProject = createProject({
    name: "prisma-resolved-index",
    lintConfig: [
      'import { evidence, type IEvidenceGraphConfig } from "@samchon/lint-plugin-evidence";',
      "",
      "const graph: IEvidenceGraphConfig = {",
      '  index: { output: ".graph/evidence-index.json" },',
      "  claims: [{",
      '    type: "typescript",',
      '    files: ["src/**/*.ts"],',
      '    symbol: "type",',
      '    reference: { type: "prisma", files: ["prisma/schema.prisma"], symbol: ["model", "column"] },',
      "  }],",
      "};",
      "",
      "export default {",
      "  plugins: { evidence },",
      '  rules: { "evidence/graph": ["error", graph] },',
      "};",
      "",
    ].join("\n"),
    files: {
      "prisma/schema.prisma": ["model Order {", "  id Int @id", "}", ""].join(
        "\n",
      ),
      "src/order.ts": [
        "/** @evidence prisma:Order Owns the persisted order contract. */",
        "export interface IOrderService {}",
        "",
      ].join("\n"),
    },
  });
  try {
    assertStatus(
      runCheck(project.directory),
      0,
      "A TypeScript claim should acknowledge the selected Prisma model and column.",
    );
    const index = JSON.parse(
      fs.readFileSync(
        path.join(project.directory, ".graph", "evidence-index.json"),
        "utf8",
      ),
    ) as {
      version: number;
      declarations: Array<{
        target: string;
        resolvedTarget: { target: string; type: string; symbol: string };
      }>;
    };
    assert.equal(index.version, 1);
    assert.equal(index.declarations.length, 1);
    assert.equal(index.declarations[0]?.target, "prisma:Order");
    assert.equal(index.declarations[0]?.resolvedTarget.target, "prisma:Order");
    assert.equal(index.declarations[0]?.resolvedTarget.type, "prisma");
    assert.equal(index.declarations[0]?.resolvedTarget.symbol, "model");
  } finally {
    project.cleanup();
  }
};

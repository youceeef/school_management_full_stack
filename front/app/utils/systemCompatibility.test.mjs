import test from "node:test";
import assert from "node:assert/strict";
import { evaluateApiCompatibility, shortVersion } from "./systemCompatibility.js";

test("matching schema versions are compatible", () => {
  assert.deepEqual(evaluateApiCompatibility({ api_schema_version: "1" }, "1"), {
    status: "compatible",
    expected: "1",
    actual: "1",
    compatible: true,
  });
});

test("different schema versions are incompatible", () => {
  const result = evaluateApiCompatibility({ api_schema_version: "2" }, "1");

  assert.equal(result.status, "incompatible");
  assert.equal(result.compatible, false);
  assert.equal(result.actual, "2");
});

test("missing schema version is unknown and fails closed", () => {
  const result = evaluateApiCompatibility({}, "1");

  assert.equal(result.status, "unknown");
  assert.equal(result.compatible, false);
  assert.equal(result.actual, null);
});

test("shortVersion truncates commit hashes without changing short labels", () => {
  assert.equal(shortVersion("8b5a86e1062bb3c74be05f21c6d9af2e2daa75cb"), "8b5a86e1062b");
  assert.equal(shortVersion("local"), "local");
  assert.equal(shortVersion(null), "—");
});

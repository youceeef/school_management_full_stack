import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEmailVerificationStatus } from "./status.mjs";

test("known verification statuses remain unchanged", () => {
  for (const status of ["success", "already", "expired", "invalid"]) {
    assert.equal(normalizeEmailVerificationStatus(status), status);
  }
});

test("unknown and inherited property names fall back to invalid", () => {
  for (const status of [null, undefined, "", "constructor", "__proto__", "toString", "unexpected"]) {
    assert.equal(normalizeEmailVerificationStatus(status), "invalid");
  }
});

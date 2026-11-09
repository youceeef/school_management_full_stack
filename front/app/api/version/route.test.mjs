import test from "node:test";
import assert from "node:assert/strict";
import { GET } from "./route.js";

test("frontend version endpoint returns deployment metadata without caching", async () => {
  process.env.NEXT_PUBLIC_APP_VERSION = "frontend-test-sha";
  process.env.NEXT_PUBLIC_BUILD_TIME = "2026-11-09T00:00:00Z";
  process.env.NEXT_PUBLIC_API_SCHEMA_VERSION = "1";

  const response = GET();
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.deepEqual(body, {
    application: "EduSpace Frontend",
    version: "frontend-test-sha",
    build_time: "2026-11-09T00:00:00Z",
    api_schema_version: "1",
  });
});

const required = ["PRODUCTION_FRONTEND_URL", "PRODUCTION_API_URL", "EXPECTED_SHA"];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const frontendUrl = process.env.PRODUCTION_FRONTEND_URL.replace(/\/$/, "");
const apiUrl = process.env.PRODUCTION_API_URL.replace(/\/$/, "");
const expectedSha = process.env.EXPECTED_SHA;
const expectedSchema = process.env.EXPECTED_API_SCHEMA_VERSION || "1";
const maxAttempts = Number(process.env.MAX_ATTEMPTS || 30);
const retryDelayMs = Number(process.env.RETRY_DELAY_MS || 20000);

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(45000),
  });

  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}`);
  }

  return response.json();
}

async function verify() {
  const [frontendResponse, frontendMetadata, apiHealth] = await Promise.all([
    fetch(frontendUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    }),
    fetchJson(`${frontendUrl}/api/version`),
    fetchJson(`${apiUrl}/health`),
  ]);

  if (!frontendResponse.ok) {
    throw new Error(`Frontend returned HTTP ${frontendResponse.status}`);
  }

  const failures = [];

  if (frontendMetadata.version !== expectedSha) {
    failures.push(
      `frontend SHA ${frontendMetadata.version || "missing"} != ${expectedSha}`
    );
  }

  if (apiHealth.version !== expectedSha) {
    failures.push(`API SHA ${apiHealth.version || "missing"} != ${expectedSha}`);
  }

  if (String(frontendMetadata.api_schema_version) !== expectedSchema) {
    failures.push(
      `frontend schema ${frontendMetadata.api_schema_version || "missing"} != ${expectedSchema}`
    );
  }

  if (String(apiHealth.api_schema_version) !== expectedSchema) {
    failures.push(
      `API schema ${apiHealth.api_schema_version || "missing"} != ${expectedSchema}`
    );
  }

  if (apiHealth.status !== "ok") {
    failures.push(`API readiness status is ${apiHealth.status || "missing"}`);
  }

  for (const name of ["database", "profile_storage", "document_storage"]) {
    if (apiHealth.checks?.[name]?.status !== "ok") {
      failures.push(`${name} is ${apiHealth.checks?.[name]?.status || "missing"}`);
    }
  }

  if (failures.length > 0) {
    throw new Error(failures.join("; "));
  }

  return {
    frontendVersion: frontendMetadata.version,
    apiVersion: apiHealth.version,
    schemaVersion: expectedSchema,
    apiBuildTime: apiHealth.build_time,
  };
}

let lastError;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  try {
    const result = await verify();
    console.log(
      `Production verified: frontend=${result.frontendVersion} api=${result.apiVersion} schema=${result.schemaVersion}`
    );
    process.exit(0);
  } catch (error) {
    lastError = error;
    console.log(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);

    if (attempt < maxAttempts) {
      await wait(retryDelayMs);
    }
  }
}

throw new Error(`Production verification failed: ${lastError?.message || "unknown error"}`);

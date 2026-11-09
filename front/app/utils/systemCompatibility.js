export const DEFAULT_API_SCHEMA_VERSION = "1";

export function evaluateApiCompatibility(
  health,
  expectedVersion = process.env.NEXT_PUBLIC_API_SCHEMA_VERSION || DEFAULT_API_SCHEMA_VERSION
) {
  const expected = String(expectedVersion);
  const actual =
    health?.api_schema_version === undefined || health?.api_schema_version === null
      ? null
      : String(health.api_schema_version);

  if (!actual) {
    return { status: "unknown", expected, actual: null, compatible: false };
  }

  const compatible = actual === expected;

  return {
    status: compatible ? "compatible" : "incompatible",
    expected,
    actual,
    compatible,
  };
}

export function shortVersion(version) {
  if (!version) return "—";
  const normalized = String(version);
  return normalized.length > 12 ? normalized.slice(0, 12) : normalized;
}

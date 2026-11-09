export function GET() {
  return Response.json(
    {
      application: "EduSpace Frontend",
      version: process.env.NEXT_PUBLIC_APP_VERSION || "local",
      build_time: process.env.NEXT_PUBLIC_BUILD_TIME || null,
      api_schema_version: process.env.NEXT_PUBLIC_API_SCHEMA_VERSION || "1",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}

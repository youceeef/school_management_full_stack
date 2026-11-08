const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");
const storageUrl = new URL(process.env.NEXT_PUBLIC_STORAGE_URL || apiUrl.origin);
const isProduction = process.env.NODE_ENV === "production";

const imagePattern = (url) => ({
  protocol: url.protocol.replace(":", ""),
  hostname: url.hostname,
  port: url.port,
  pathname: "/**",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [imagePattern(apiUrl), imagePattern(storageUrl)],
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      `frame-ancestors ${isProduction ? "'none'" : "*"}`,
      "object-src 'none'",
      `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' ${apiUrl.origin}${isProduction ? "" : " ws: wss:"}`,
      `img-src 'self' data: blob: ${apiUrl.origin} ${storageUrl.origin}`,
      "font-src 'self' data:",
      "worker-src 'self' blob:",
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];

    if (isProduction) {
      securityHeaders.push({ key: "X-Frame-Options", value: "DENY" });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

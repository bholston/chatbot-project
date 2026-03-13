import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Keep these packages as native Node modules — don't let Turbopack bundle them.
  // @chroma-core/default-embed ships test files that Turbopack can't compile.
  serverExternalPackages: ["chromadb", "@chroma-core/default-embed"],

  async headers() {
    return [
      {
        // Allow /embed to be iframed from any origin (needed for the widget)
        source: "/embed",
        headers: [
          // frame-ancestors * overrides X-Frame-Options in modern browsers.
          // Both are set for maximum compatibility.
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

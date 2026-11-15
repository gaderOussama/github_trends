import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // data/repos.json is read with fs at request time, so ship it with the server bundle.
  outputFileTracingIncludes: { "/": ["./data/repos.json"] },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

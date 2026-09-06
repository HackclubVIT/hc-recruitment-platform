import type { NextConfig } from "next";

let rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
let basePath: string | undefined = undefined;

if (rawBasePath) {
  try {
    if (rawBasePath.startsWith("http://") || rawBasePath.startsWith("https://")) {
      rawBasePath = new URL(rawBasePath).pathname;
    }
  } catch {}

  rawBasePath = rawBasePath.replace(/\/+$/, "");
  if (rawBasePath && !rawBasePath.startsWith("/")) {
    rawBasePath = `/${rawBasePath}`;
  }
  if (rawBasePath !== "/" && rawBasePath !== "") {
    basePath = rawBasePath;
  }
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

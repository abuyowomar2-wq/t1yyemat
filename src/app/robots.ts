import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/reviews"],
      disallow: ["/admin", "/review"],
    },
  };
}

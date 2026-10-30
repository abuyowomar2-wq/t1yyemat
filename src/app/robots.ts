import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/reviews", "/signup", "/login", "/u"],
      disallow: ["/admin", "/review", "/dashboard", "/r"],
    },
  };
}

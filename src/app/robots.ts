import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/settings", "/add-update", "/edit-update", "/add-business", "/edit-business", "/history", "/hmrc-obligations", "/hmrc-submit", "/preview"],
      },
    ],
    sitemap: "https://flonancial.co.uk/sitemap.xml",
  };
}

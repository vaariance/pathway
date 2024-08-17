import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://thepathway.to",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://app.thepathway.to/?mode=noble",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://app.thepathway.to/?mode=arbitrum",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.2,
    },
  ];
}

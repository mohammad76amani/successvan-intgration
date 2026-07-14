import { MetadataRoute } from "next";
import { categoryNameToSlug, fetchAllCategories } from "@/lib/category-utils";

interface Blog {
  slug: string;
  updatedAt: string;
  seo: {
    canonicalUrl?: string;
  };
}

async function getBlogs(): Promise<Blog[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://successvanhire.co.uk";
    const res = await fetch(`${baseUrl}/api/blog?status=published&limit=999`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.blogs || data.data || [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://successvanhire.co.uk";

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },

    // PILLARS ---------------------------------------------------------
    {
      url: `${baseUrl}/van-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,

    },
    {
      url: `${baseUrl}/removal-van-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,

    },
    {
      url: `${baseUrl}/luton-van-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,

    },
    {
      url: `${baseUrl}/cheap-van-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,

    },
    {
      url: `${baseUrl}/minibus-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,

    },
    {
      url: `${baseUrl}/self-drive-van-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,

    },
    {
      url: `${baseUrl}/automatic-van-hire-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/van-hire-near-me`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },

    // STATIC PAGES ---------------------------------------------------------
    {
      url: `${baseUrl}/aboutus`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/reservation`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/policy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms-and-conditions`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    },

    // Landing Pages For marketing
    {
      url: `${baseUrl}/tagore-jayanti-celebration-minibus-hire-london`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },



    // Location pages ---------------------------------------------------------
    {
      url: `${baseUrl}/van-hire-colindale`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-dollis-hill`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-ealing`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-edgware`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-finchley`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-golders-green`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-harrow`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-kilburn`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-neasden`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-staples-corner`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-park-royal`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-west-hampstead`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-willesden-green`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-north-west-london`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/van-hire-cricklewood`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },

    {
      url: `${baseUrl}/van-hire-hampstead`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/van-hire-hendon`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/van-hire-mill-hill`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/van-hire-wembley`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/van-hire-wembley-2-2`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },


    {
      url: `${baseUrl}/success-van-hire-van-rental-in-brent-cross-london-last-minute-bookings`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];

  // Fetch dynamic blog posts
  const blogs = await getBlogs();

  const blogRoutes = blogs.map((blog) => ({
    url: `${baseUrl}/blog${blog.seo?.canonicalUrl || blog.slug}`,
    lastModified: new Date(blog.updatedAt),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Fetch dynamic van/category detail pages
  const categories = await fetchAllCategories();

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/categories/${categoryNameToSlug(category.name)}`,
    lastModified: category.updatedAt ? new Date(category.updatedAt) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...blogRoutes, ...categoryRoutes];
}

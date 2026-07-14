/**
 * Shared Blog Generation Utilities
 *
 * Common functions and configurations used by both:
 * - blog-generator.ts (full generation)
 * - blog-step-generator.ts (step-by-step generation)
 */

// OpenAI client should be used via `lib/openai.ts` which provides a server-only factory (`getOpenAI`).
// Do NOT initialize OpenAI here to avoid constructing it in client-side bundles.

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a unique ID with timestamp and random suffix
 * @returns Unique identifier string
 */
export const generateId = (): string =>
  `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Get current year for SEO title generation
 * @returns Current year as number
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

// ============================================================================
// TEXT UTILITIES (Blog generation)
// ============================================================================

/**
 * Calculate reading time based on word count (200 words/minute)
 * @param text - Text content to analyze
 * @returns Reading time in minutes
 */
export const calculateReadingTime = (text: string): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

/**
 * Strip HTML tags from text
 * @param html - HTML string
 * @returns Plain text without HTML tags
 */
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "");
};

/**
 * Count words in text
 * @param text - Text to count words
 * @returns Number of words
 */
export const countWords = (text: string): number => {
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
};

// ============================================================================
// SLUG & URL UTILITIES (Legacy blog utilities)
// ============================================================================

// Helper function to generate slug from title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// Helper function to safely coerce content to string (supports string or structured content)
function coerceContentToString(content: any): string {
  if (!content && content !== 0) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object") {
    // Prefer compiledHtml, summary, or fallback to JSON string (concise)
    return (
      (content.compiledHtml as string) ||
      (content.summary as string) ||
      JSON.stringify(content)
    );
  }
  return String(content);
}

// Helper function to extract first image from HTML content
export const extractImageFromContent = (content: any): string => {
  const html = coerceContentToString(content);
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : "";
};

// Helper function to get excerpt from content
export const getExcerpt = (
  content: string,
  maxLength: number = 150,
): string => {
  const stripped = stripHtml(content);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength).trim() + "...";
};

// ============================================================================
// CONTENT ASSEMBLY
// ============================================================================

// Helper function to apply anchor links to content
function applyAnchorsToContent(html: string, anchors: any[]): string {
  if (!Array.isArray(anchors) || anchors.length === 0) return html;
  let result = html;
  anchors.forEach((anchor) => {
    if (anchor.keyword && anchor.url) {
      // Escape special regex characters in keyword
      const escapedKeyword = anchor.keyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
      );
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, "gi");
      result = result.replace(
        regex,
        `<a href="${anchor.url}" class="text-[#fe9a00] hover:underline" target="_blank">${anchor.keyword}</a>`,
      );
    }
  });
  return result;
}

// Assemble structured content object into a single HTML string
function assembleContentFromObject(contentObj: any): string {
  if (!contentObj) return "";
  // If compiledHtml exists, prefer it
  if (typeof contentObj === "string") return contentObj;
  if (contentObj.compiledHtml && contentObj.compiledHtml.trim() !== "") {
    return contentObj.compiledHtml;
  }

  const parts: string[] = [];

  // Get anchors from seo section (passed in contentObj for convenience)
  const anchors = contentObj.anchors || [];

  // Summary section with heading
  if (contentObj.summary) {
    const summaryWithAnchors = applyAnchorsToContent(
      contentObj.summary,
      anchors,
    );

    parts.push(
      `<div class="bg-linear-to-r from-[#fe9a00] to-amber-600 p-8 rounded-2xl mb-8 border border-orange-500/20 backdrop-blur-sm">`,
    );
    parts.push(`  <div class="flex items-start gap-4">`);

    parts.push(`    <div class="flex-1">`);
    parts.push(
      `      <h3 class="text-black font-bold text-xs  md:text-lg mb-2">Quick Overview</h3>`,
    );
    parts.push(
      `      <p class="text-gray-300 text-xs leading-relaxed italic">${summaryWithAnchors}</p>`,
    );
    parts.push(`    </div>`);
    parts.push(`  </div>`);
    parts.push(`</div>`);
  }

  if (Array.isArray(contentObj.headings)) {
    contentObj.headings.forEach((h: any) => {
      // Handle CTA Block
      if (h.type === "cta" && h.ctaConfig) {
        const cta = h.ctaConfig;
        parts.push(
          `<div id="section-${h.id || ""}" class="cta-block my-8 rounded-2xl p-8  text-center" style="background-color: ${cta.backgroundColor}">`,
        );
        parts.push(
          `  <h2 class="font-bold text-2xl mb-3" style="color: ${cta.textColor}">${cta.title}</h2>`,
        );
        parts.push(
          `  <p class="text-sm mb-6 opacity-90" style="color: ${cta.textColor}">${cta.subtitle}</p>`,
        );
        parts.push(
          `  <a href="${cta.link}" class="inline-block px-8 py-3 rounded-xl font-semibold text-sm transition-transform hover:scale-105" style="background-color: ${cta.buttonColor}; color: ${cta.backgroundColor}">${cta.buttonText}</a>`,
        );
        if (cta.phoneNumber) {
          parts.push(
            `  <p class="text-xs mt-4 opacity-75" style="color: ${cta.textColor}">${cta.phoneNumber}</p>`,
          );
        }
        parts.push(`</div>`);
        return;
      }

      // Handle Van List Block
      if (h.type === "vanlist" && h.vanConfig) {
        const vanConfig = h.vanConfig;
        parts.push(
          `<div id="section-${h.id || ""}" class="van-list-block mt-8   p-1  "  >`,
        );
        parts.push(
          `  <div class="text-center   bg-[#fe9a00] p-2 rounded-2xl -mb-6 ">`,
        );
        parts.push(
          `    <h6 class="font-bold text-base md:text-2xl mt-4 text-black/80">${vanConfig.title}</h6>`,
        );
        parts.push(
          `    <span class="text-sm border-b border-gray-200 pb-1 px-2" style={color:white}>${vanConfig.subtitle}</span>`,
        );
        parts.push(`  </div>`);
        parts.push(
          `  <div class="van-listing-container" data-van-config='${JSON.stringify(vanConfig)}'>`,
        );
        parts.push(`    <!-- Van listing will be rendered here -->`);
        if (vanConfig.showReservation) {
          parts.push(
            `    <div class="reservation-panel-placeholder mt-8 p-6 bg-slate-800/50 rounded-xl text-center">`,
          );
          parts.push(
            `      <p class="text-slate-400 mb-4">Ready to book? Select your van above and complete your reservation.</p>`,
          );
          parts.push(
            `      <button class="px-6 py-3 bg-[#fe9a00] text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors">Start Reservation</button>`,
          );
          parts.push(`    </div>`);
        }
        parts.push(`  </div>`);
        parts.push(`</div>`);
        return;
      }

      // Normal heading section
      const level = h.level && Number.isFinite(h.level) ? h.level : 2;
      const idAttr = h.id ? ` id="${h.id}"` : "";
      parts.push(`<h${level}${idAttr}>${h.text}</h${level}>`);
      if (h.content) {
        const contentWithAnchors = applyAnchorsToContent(h.content, anchors);
        parts.push(`<div>${contentWithAnchors}</div>`);
      }
    });
  }

  // Conclusion section with heading
  if (contentObj.conclusion) {
    const conclusionWithAnchors = applyAnchorsToContent(
      contentObj.conclusion,
      anchors,
    );
    parts.push(
      `<div class="p-8 rounded-2xl my-16 border bg-[#fe9a00] border-slate-700 shadow-xl">`,
    );
    parts.push(`<h2 class="font-bold text-xl text-black"> Conclusion</h2>`);
    parts.push(`  <div class="flex items-start gap-4">`);

    parts.push(`    <div class="flex-1">`);

    parts.push(
      `      <div class="text-gray-300 leading-relaxed space-y-3">${conclusionWithAnchors}</div>`,
    );
    parts.push(`    </div>`);
    parts.push(`  </div>`);
    parts.push(`</div>`);
  }

  // FAQ section with heading
  if (Array.isArray(contentObj.faqs) && contentObj.faqs.length > 0) {
    parts.push(
      `<h2 class="font-bold text-lg md:text-2xl w-full md:w-fit mb-6 py-6 px-2 mt-10 bg-[#0f172b] rounded-xl text-black"> FAQ ...</h2>`,
    );
    parts.push(`<div class="grid gap-4">`);
    contentObj.faqs.forEach((faq: any, index: number) => {
      if (faq.question && faq.answer) {
        const answerWithAnchors = applyAnchorsToContent(faq.answer, anchors);
        parts.push(
          `  <div class="bg-slate-900/95 rounded-2xl border border-gray-700 p-6 hover:border-[#fe9a00]/30 transition-all duration-300">`,
        );
        parts.push(`    <div class="flex items-start gap-4">`);
        parts.push(
          `      <div class="shrink-0 hidden  w-6 h-6 bg-[#fe9a00]/20 rounded-xl md:flex items-center justify-center text-[#fe9a00] text-lg font-bold">${index + 1}</div>`,
        );
        parts.push(`      <div class="flex-1">`);
        parts.push(
          `        <h5 class="text-white font-semibold text-base md:text-lg mb-3">${faq.question}</h5>`,
        );
        parts.push(
          `        <p class="text-gray-300 leading-relaxed text-xs md:text-base">${answerWithAnchors}</p>`,
        );
        parts.push(`      </div>`);
        parts.push(`    </div>`);
        parts.push(`  </div>`);
      }
    });
    parts.push(`</div>`);
  }

  return parts.join("\n");
}

// ============================================================================
// BLOG POST FORMATTING
// ============================================================================

interface BlogPost {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  description?: string;
  content?: any;
  seo?: any;
  media?: any;
  readingTime?: number;
  wordCount?: number;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  category?: string;
}

interface BlogPostFormatted {
  id: string;
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  category: string;
  date: string;
  readTime: number;
  seoTitle?: string;
  seo: {
    publishDate: string | number | Date;
    seoDescription?: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  canonicalUrl?: string;
}

// Estimate reading time from content string
function estimateReadTime(content: string): number {
  const words = stripHtml(content)
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

export const convertApiToBlogPost = (apiData: BlogPost): BlogPostFormatted => {
  const date = new Date(apiData.createdAt!).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  // Support both string and structured content objects
  const rawContent: any = (apiData as any).content;
  let contentStr = "";
  if (typeof rawContent === "string") {
    contentStr = rawContent;
  } else if (rawContent && typeof rawContent === "object") {
    // Assemble from structured content when compiledHtml is missing
    contentStr = assembleContentFromObject(rawContent);
  } else {
    contentStr = String(rawContent || "");
  }

  const featured = (apiData as any).media?.featuredImage || "";
  const image =
    featured || extractImageFromContent(contentStr) || "/assets/images/van.png";

  const computedSlug =
    (apiData as any).slug ||
    generateSlug((apiData as any).seo?.seoTitle || apiData.title || "");

  return {
    id: apiData.id || "",
    _id: apiData._id || "",
    title: (apiData as any).seo?.seoTitle || apiData.title || "",
    slug: computedSlug,
    excerpt: getExcerpt(contentStr || apiData.description || "", 160),
    content: contentStr || apiData.content || "",
    image,
    author: (apiData as any).author || "Success Van",
    category: (apiData as any).category || "Blog",
    date: date,
    readTime:
      (apiData as any).readingTime ||
      Math.max(1, estimateReadTime(contentStr || "")),
    seoTitle: (apiData as any).seoTitle || (apiData as any).title || "",
    seo: {
      seoDescription:
        (apiData as any).seo?.seoDescription ||
        getExcerpt(contentStr || apiData.description || "", 160),
        publishDate: (apiData as any).seo?.publishDate || new Date(),
    },
    tags: (apiData as any).seo?.tags || [],
    createdAt: apiData.createdAt || "",
    updatedAt: apiData.updatedAt || "",
  };
};

// ============================================================================
// API FETCHING
// ============================================================================

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const fetchAllBlogs = async (): Promise<BlogPostFormatted[]> => {
  try {
    const res = await fetch(`${baseUrl}/api/blog?limit=100`);
    const data = await res.json();
    return (data.blogs || []).map((b: any) => convertApiToBlogPost(b));
  } catch (error) {
    console.log("Error fetching all blogs:", error);
    return [];
  }
};

// Fetch a single blog by slug or id
export const fetchBlogBySlug = async (
  slugOrId: string,
): Promise<BlogPostFormatted | null> => {
  try {
    // Normalize input: remove query/hash and trim
    const cleanedId = (slugOrId || "").split(/[?#]/)[0].trim();
    console.log("[Blog Utils] Fetching blog by identifier:", cleanedId);

    // Try single-blog endpoint first (works with both Mongo _id, slug, and canonicalUrl)
    try {
      // Normalize possible canonical URL input: if it's a full URL, try the pathname as an alternative identifier
      const candidates = [slugOrId];
      try {
        if (/^https?:\/\//i.test(slugOrId)) {
          const u = new URL(slugOrId);
          candidates.push(u.pathname, u.pathname.replace(/\/$/, ""));

          const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(
            /\/$/,
            "",
          );
          if (siteUrl) candidates.push(`${siteUrl}${u.pathname}`);
        }
      } catch (e) {
        // not a full URL
      }

      let found: BlogPostFormatted | null = null;

      for (const candidate of Array.from(new Set(candidates))) {
        const res = await fetch(
          `${baseUrl}/api/blog/${encodeURIComponent(candidate)}`,
        );

        if (!res.ok) {
          // try next candidate
          console.debug(
            `[Blog Utils] Candidate ${candidate} returned ${res.status}`,
          );
          continue;
        }

        const data = await res.json();
        console.log(
          `[Blog Utils] Single blog API response for ${candidate}:`,
          data,
        );

        if (data?.success && data?.blog) {
          const b: any = data.blog;
          // Normalize structured content and assemble if needed
          const rawContent = b.content;
          let contentStr = "";
          if (typeof rawContent === "string") contentStr = rawContent;
          else if (rawContent && typeof rawContent === "object")
            contentStr = assembleContentFromObject(rawContent);

          const image =
            b.media?.featuredImage ||
            extractImageFromContent(contentStr || "") ||
            "/assets/images/van.png";

          found = {
            id: b.id || b._id || "",
            _id: b._id || "",
            canonicalUrl: b.seo?.canonicalUrl || undefined,
            title: b.seo?.seoTitle || b.title || "",
            slug: b.slug || generateSlug(b.seo?.seoTitle || b.title || ""),
            excerpt: getExcerpt(contentStr || b.excerpt || "", 160),
            content: contentStr || b.content || "",
            image,
            seo: {
              seoDescription: b.seo?.seoDescription || "",
              publishDate:b.seo.publishDate
            },
            author: b.author || "Success Van",
            category: b.category || "Blog",
            date: new Date(b.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }),
            readTime: b.readingTime || 1,
            seoTitle: b.seo?.seoTitle || b.title || "",
            tags: b.seo?.tags || [],
            createdAt: b.createdAt || "",
            updatedAt: b.updatedAt || "",
          };
          break;
        }
      }

      if (found) {
        console.log(`✅ [Blog Utils] Found blog: ${found.title}`);
        return found;
      }
    } catch (apiError) {
      console.warn(
        "[Blog Utils] Single blog API failed, falling back to list endpoint:",
        apiError,
      );
    }

    // Fallback: fetch all and filter
    const allBlogs = await fetchAllBlogs();
    const matched = allBlogs.find(
      (b) =>
        b.slug === slugOrId ||
        b.id === slugOrId ||
        b.title.toLowerCase().replace(/\s+/g, "-") === slugOrId.toLowerCase(),
    );

    if (matched) {
      return matched;
    }

    // Try case-insensitive slug match
    return (
      allBlogs.find(
        (b) =>
          b.slug.toLowerCase() === slugOrId.toLowerCase().replace(/ /g, "-"),
      ) || null
    );
  } catch (error) {
    console.log("Error fetching blog by slug:", error);
    return null;
  }
};

// ============================================================================
// SCHEMA GENERATION
// ============================================================================

function generateBlogSchema(blog: BlogPostFormatted, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.seoTitle || blog.title,
    description: blog.excerpt,
    image: blog.image ? [blog.image] : undefined,
    author: {
      "@type": "Person",
      name: blog.author,
    },
    publisher: {
      "@type": "Organization",
      name: "Success Van Hire",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/assets/images/logo.png`,
      },
    },
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${blog.slug}`,
    },
  };
}

function generateBreadcrumbSchema(siteUrl: string, blogTitle: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${siteUrl}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: blogTitle,
      },
    ],
  };
}

function generateOrganizationSchema(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Success Van Hire",
    url: siteUrl,
    logo: `${siteUrl}/assets/images/logo.png`,
    sameAs: [
      "https://www.facebook.com/topvanhire",
      "https://x.com/MatinDiba?t=GKR1BWNSQK6yB2Rj4W5Jhg&s=09",
      "https://www.instagram.com/accounts/login/?next=https%3A%2F%2Fwww.instagram.com%2Fsuccess.van.hire&is_from_rle",
    ],
  };
}

export {
  generateBlogSchema,
  generateBreadcrumbSchema,
  generateOrganizationSchema,
};

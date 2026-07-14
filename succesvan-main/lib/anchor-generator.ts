// ============================================================================
// ANCHOR URL GENERATOR - ENHANCED VERSION
// ============================================================================
// Generates optimized URLs for anchor keywords using internal and external links

import { getOpenAI } from "./openai";
import Blog from "@/model/blogs";

/**
 * Available internal pages/routes in the application
 */
const INTERNAL_PAGES = [
  { path: '/', title: 'Home', keywords: ['home', 'homepage', 'main page', 'van hire', 'van rental', 'rent a van'] },
  { path: '/aboutus', title: 'About Us', keywords: ['about', 'company', 'team', 'who we are', 'our story'] },
  { path: '/contact-us', title: 'Contact Us', keywords: ['contact', 'reach us', 'get in touch', 'support', 'help', 'customer service'] },
  { path: '/reservation', title: 'Reservation', keywords: ['book', 'reserve', 'booking', 'rent', 'reservation', 'hire now', 'book a van'] },
  { path: '/blog', title: 'Blog', keywords: ['blog', 'articles', 'news', 'posts', 'guides', 'tips'] },
  { path: '/policy', title: 'Policy', keywords: ['policy', 'privacy', 'legal', 'data protection'] },
  { path: '/terms-and-conditions', title: 'Terms and Conditions', keywords: ['terms', 'conditions', 'agreement', 'legal terms', 'rental terms'] },
  { path: '/dashboard', title: 'Dashboard', keywords: ['dashboard', 'admin', 'management', 'control panel'] },
  { path: '/customerDashboard', title: 'Customer Dashboard', keywords: ['customer', 'account', 'profile', 'my account', 'bookings'] },
  { path: '/automatic-van-hire-london', title: 'Automatic Van Hire London', keywords: ['automatic', 'auto', 'automatic van', 'london', 'automatic transmission'] },
  { path: '/van-hire-cricklewood', title: 'Van Hire Cricklewood', keywords: ['cricklewood', 'van hire cricklewood', 'cricklewood van'] },
  { path: '/van-hire-finchley', title: 'Van Hire Finchley', keywords: ['finchley', 'van hire finchley', 'finchley van hire', 'persian community finchley', 'iranian community finchley'] },
  { path: '/van-hire-golders-green', title: 'Van Hire Golders Green', keywords: ['golders green', 'van hire golders green'] },
  { path: '/van-hire-hampstead', title: 'Van Hire Hampstead', keywords: ['hampstead', 'van hire hampstead'] },
  { path: '/van-hire-hendon', title: 'Van Hire Hendon', keywords: ['hendon', 'van hire hendon'] },
  { path: '/van-hire-mill-hill', title: 'Van Hire Mill Hill', keywords: ['mill hill', 'van hire mill hill'] },
  { path: '/van-hire-north-west-london', title: 'Van Hire North West London', keywords: ['north west london', 'nw london', 'north london', 'van hire north west'] },
  { path: '/van-hire-wembley', title: 'Van Hire Wembley', keywords: ['wembley', 'van hire wembley', 'wembley stadium'] },
  { path: '/car-hire-nw-london', title: 'Car Hire NW London', keywords: ['car hire', 'car rental', 'rent a car', 'nw london cars'] },
];

/**
 * Fetch all blog canonical URLs from database
 */
async function fetchBlogCanonicalURLs(): Promise<Array<{ url: string; title: string; keywords: string[] }>> {
  try {
    const blogs = await Blog.find(
      { 
        'seo.canonicalUrl': { $exists: true, $ne: '' }, 
        status: { $in: ['published', 'draft'] } // Include drafts too for internal linking
      },
      { 'seo.canonicalUrl': 1, 'seo.seoTitle': 1, 'seo.tags': 1, 'seo.focusKeyword': 1 }
    ).limit(200);

    return blogs.map((blog: any) => {
      const keywords = [
        ...(blog.seo.tags || []),
        blog.seo.focusKeyword,
      ].filter(Boolean).map((k: string) => k.toLowerCase().trim());

      return {
        url: blog.seo.canonicalUrl,
        title: blog.seo.seoTitle || 'Blog Post',
        keywords: keywords
      };
    });
  } catch (error) {
    console.log('Error fetching blog URLs:', error);
    return [];
  }
}

/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Contains match
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Word overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const overlap = words1.filter(w => words2.includes(w)).length;
  const maxWords = Math.max(words1.length, words2.length);
  
  return overlap / maxWords;
}

/**
 * Find best matching internal link for a keyword
 */
function findInternalMatch(keyword: string, blogUrls: Array<{ url: string; title: string; keywords: string[] }>): { url: string; score: number } | null {
  const keywordLower = keyword.toLowerCase().trim();
  let bestMatch: { url: string; score: number } | null = null;

  // Check internal pages
  for (const page of INTERNAL_PAGES) {
    for (const pageKeyword of page.keywords) {
      const score = calculateSimilarity(keywordLower, pageKeyword);
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { url: page.path, score };
      }
    }
  }

  // Check blog posts
  for (const blog of blogUrls) {
    for (const blogKeyword of blog.keywords) {
      const score = calculateSimilarity(keywordLower, blogKeyword);
      if (score > 0.6 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { url: blog.url, score };
      }
    }
    
    // Also check against title
    const titleScore = calculateSimilarity(keywordLower, blog.title);
    if (titleScore > 0.6 && (!bestMatch || titleScore > bestMatch.score)) {
      bestMatch = { url: blog.url, score: titleScore };
    }
  }

  // Only return if score is good enough
  return bestMatch && bestMatch.score > 0.7 ? bestMatch : null;
}

/**
 * Generate anchor keywords and URLs using AI
 */
export async function generateAnchorURLs(
  initialAnchors: Array<{ id: string; keyword: string; url?: string }>,
  blogTopic: string,
  focusKeyword: string,
  blogContent?: string
): Promise<Array<{ id: string; keyword: string; url: string }>> {
  console.log(`🔗 [Anchor Generator] Starting anchor generation for: "${blogTopic}"`);

  // Step 1: Ask AI to generate better anchor keywords (7-10 keywords)
  const systemPrompt = `You are an SEO expert specializing in anchor text optimization.

Generate 7-10 strategic anchor keywords for internal and external linking. These should be:
- Specific, linkable phrases (not generic headings)
- Mix of focus keyword variations and related terms
- Industry terms that benefit from authoritative sources
- Location-specific terms if relevant
- Service/product-specific terms

Return JSON:
{
  "anchors": [
    {
      "keyword": "specific linkable phrase",
      "context": "why this keyword is valuable for linking",
      "priority": "high|medium|low"
    }
  ]
}

Return ONLY valid JSON object.`;

  const userPrompt = `Blog topic: "${blogTopic}"
Focus keyword: "${focusKeyword}"

Generate 7-10 strategic anchor keywords that would benefit from internal or external links.
Focus on specific, actionable terms rather than generic headings.`;

  let aiAnchors: Array<{ keyword: string; context?: string; priority?: string }> = [];

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"anchors":[]}');
    aiAnchors = result.anchors || [];
    console.log(`   🤖 AI generated ${aiAnchors.length} anchor keywords`);
  } catch (error) {
    console.log('   ⚠️ AI keyword generation failed:', error);
    // Fall back to initial anchors
    aiAnchors = initialAnchors.map(a => ({ keyword: a.keyword }));
  }

  // Step 2: Fetch existing blog URLs for internal matching
  const blogUrls = await fetchBlogCanonicalURLs();
  console.log(`   📚 Found ${blogUrls.length} blog posts for internal linking`);

  // Step 3: Match keywords to internal URLs
  const updatedAnchors: Array<{ id: string; keyword: string; url: string; source?: string; score?: number }> = [];
  const needsExternalLinks: Array<{ keyword: string; context?: string; index: number }> = [];

  aiAnchors.forEach((anchor, index) => {
    const internalMatch = findInternalMatch(anchor.keyword, blogUrls);
    
    if (internalMatch && internalMatch.score > 0.7) {
      updatedAnchors.push({
        id: `anchor-${index + 1}`,
        keyword: anchor.keyword,
        url: internalMatch.url,
        source: 'internal',
        score: internalMatch.score
      });
      console.log(`   ✓ Internal [${(internalMatch.score * 100).toFixed(0)}%]: "${anchor.keyword}" → ${internalMatch.url}`);
    } else {
      // Mark for external link
      needsExternalLinks.push({
        keyword: anchor.keyword,
        context: anchor.context,
        index
      });
      console.log(`   ○ Needs external: "${anchor.keyword}"`);
    }
  });

  // Step 4: Get AI suggestions for external links
  if (needsExternalLinks.length > 0) {
    console.log(`   🌐 Requesting external URLs for ${needsExternalLinks.length} keywords...`);
    
    const externalSystemPrompt = `You are an SEO expert. Suggest high-quality, authoritative external URLs for anchor keywords.

Requirements:
- Provide reputable, authoritative sources (Wikipedia, gov.uk, major industry sites, established companies)
- URLs should be HTTPS only
- URLs should be directly relevant to the keyword
- Prefer .gov, .edu, .org, or major industry sites
- Avoid competitors or low-quality sites

Return JSON:
{
  "links": [
    {
      "keyword": "exact keyword from input",
      "url": "https://authoritative-site.com/relevant-page",
      "source": "Brief description of source (e.g., 'Wikipedia', 'UK Government', 'Industry association')"
    }
  ]
}

Return ONLY valid JSON object.`;

    const externalUserPrompt = `Blog topic: "${blogTopic}"
Focus: "${focusKeyword}"

Suggest authoritative external URLs for these keywords:
${needsExternalLinks.map((item, i) => `${i + 1}. "${item.keyword}"${item.context ? ` - ${item.context}` : ''}`).join('\n')}

Provide trustworthy, relevant external links that add credibility.`;

    try {
      const client2 = getOpenAI();
      const externalCompletion = await client2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: externalSystemPrompt },
          { role: "user", content: externalUserPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const externalResult = JSON.parse(externalCompletion.choices[0].message.content || '{"links":[]}');
      const externalLinks = externalResult.links || [];

      // Map external suggestions to anchors
      for (const need of needsExternalLinks) {
        const suggestion = externalLinks.find((link: any) => 
          link.keyword?.toLowerCase().trim() === need.keyword.toLowerCase().trim()
        );
        
        if (suggestion && suggestion.url && suggestion.url.startsWith('http')) {
          updatedAnchors.push({
            id: `anchor-${need.index + 1}`,
            keyword: need.keyword,
            url: suggestion.url,
            source: `external: ${suggestion.source || 'authoritative site'}`
          });
          console.log(`   ✓ External: "${need.keyword}" → ${suggestion.url}`);
          console.log(`     Source: ${suggestion.source || 'N/A'}`);
        } else {
          // Fallback to placeholder
          updatedAnchors.push({
            id: `anchor-${need.index + 1}`,
            keyword: need.keyword,
            url: '#',
            source: 'fallback'
          });
          console.log(`   ⚠ No URL found: "${need.keyword}" → #`);
        }
      }
    } catch (error) {
      console.log('   ⚠️ External link generation failed:', error);
      // Add fallbacks for failed external links
      for (const need of needsExternalLinks) {
        updatedAnchors.push({
          id: `anchor-${need.index + 1}`,
          keyword: need.keyword,
          url: '#',
          source: 'error fallback'
        });
      }
    }
  }

  // Sort by priority and remove duplicates
  const finalAnchors = updatedAnchors
    .sort((a, b) => {
      // Prioritize internal links
      if (a.source === 'internal' && b.source !== 'internal') return -1;
      if (a.source !== 'internal' && b.source === 'internal') return 1;
      // Then by score
      return (b.score || 0) - (a.score || 0);
    })
    .filter((anchor, index, self) => 
      // Remove duplicates by URL
      index === self.findIndex(a => a.url === anchor.url && anchor.url !== '#')
    );

  const validUrls = finalAnchors.filter(a => a.url !== '#').length;
  console.log(`✅ [Anchor Generator] Generated ${finalAnchors.length} anchors (${validUrls} with valid URLs)`);
  console.log(`   Internal: ${finalAnchors.filter(a => a.source === 'internal').length}`);
  console.log(`   External: ${finalAnchors.filter(a => a.source?.startsWith('external')).length}`);

  // Return clean anchor objects without metadata
  return finalAnchors.map(({ id, keyword, url }) => ({ id, keyword, url }));
}

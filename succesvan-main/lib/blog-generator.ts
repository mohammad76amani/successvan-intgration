/**
 * AI Blog Content Generator
 *
 * Generates comprehensive blog content using OpenAI GPT-4
 * - SEO-optimized titles and descriptions
 * - Structured content sections with headings (H2-H6)
 * - Auto-generated FAQs
 * - Tags and keywords
 * - Featured image suggestions
 * - Auto-link recommendations
 */

import {
  generateId,
  calculateReadingTime,
  stripHtml,
  countWords,
  getCurrentYear,
} from "./blog-utils";
import { getOpenAI } from "./openai";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  content: string;
}

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  alt: string;
  caption?: string;
}

interface Anchor {
  id: string;
  keyword: string;
  url: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface BlogPostData {
  content: {
    topic: string;
    summary: string;
    headings: HeadingItem[];
    conclusion: string;
    faqs: FAQItem[];
    tableOfContents: boolean;
    compiledHtml: string;
  };
  seo: {
    seoTitle: string;
    seoDescription: string;
    focusKeyword: string;
    canonicalUrl: string;
    tags: string[];
    author: string;
    publishDate: Date;
    anchors: Anchor[];
  };
  media: {
    mediaLibrary: MediaItem[];
    featuredImage: string;
  };
  status: string;
  wordCount: number;
  readingTime: number;
  seoScore: number;
}

// ============================================================================
// MAIN BLOG GENERATOR FUNCTION
// ============================================================================

/**
 * Generate comprehensive blog content using OpenAI
 * @param topic - The blog topic to generate content for
 * @returns Complete blog post data structure
 */
export async function generateBlogContent(
  topic: string,
): Promise<BlogPostData> {
  console.log("🤖 [Blog Generator] Starting content generation for:", topic);

  const currentYear = getCurrentYear();
  const currentDate = new Date();

  // ========================================================================
  // STEP 1: Generate blog structure and outline
  // ========================================================================
  console.log("📋 [Blog Generator] Step 1: Generating blog outline...");

  const outlinePrompt = `You are an expert SEO content strategist and blog writer. Create a comprehensive blog post outline for the topic: "${topic}"

Generate a JSON response with the following structure:

{
  "seoTitle": "Engaging, keyword-rich title (50-60 chars, include year ${currentYear})",
  "seoDescription": "Compelling meta description (140-155 chars) that makes people want to click",
  "focusKeyword": "Primary SEO keyword (1-3 words)",
  "tags": ["5-7 relevant tags as an array"],
  "outline": [
    {
      "level": 2,
      "heading": "Introduction section heading (H2)",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    },
    {
      "level": 2,
      "heading": "Main topic section (H2)",
      "keyPoints": ["Point 1", "Point 2"],
      "subsections": [
        {
          "level": 3,
          "heading": "Subsection heading (H3)",
          "keyPoints": ["Detail 1", "Detail 2"]
        }
      ]
    }
  ],
  "faqQuestions": ["FAQ question 1", "FAQ question 2", "FAQ question 3"],
  "suggestedAnchors": [
    {"keyword": "relevant term", "context": "where this term would appear"}
  ],
  "imageSearchTerms": ["search term for featured image"]
}

REQUIREMENTS:
- Create 4-6 main sections (H2 level)
- Each main section should have 2-4 subsections (H3 level) where appropriate
- Focus keyword should appear in the title
- Tags should be relevant and searchable
- Outline should flow logically and cover the topic comprehensively
- Include actionable insights and practical information
- FAQs should address common questions about the topic
- Suggested anchors should be terms that would benefit from internal/external linking

Return ONLY valid JSON, no markdown formatting.`;

  const client = getOpenAI();
  const outlineCompletion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "You are an expert SEO blog content strategist.",
      },
      { role: "user", content: outlinePrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const outline = JSON.parse(
    outlineCompletion.choices[0].message.content || "{}",
  );
  console.log("✅ [Blog Generator] Outline generated:", outline.seoTitle);

  // ========================================================================
  // STEP 2: Generate introduction/summary
  // ========================================================================
  console.log("✍️ [Blog Generator] Step 2: Generating introduction...");

  const summaryPrompt = `Write an engaging, SEO-optimized introduction paragraph (100-150 words) for a blog post titled "${outline.seoTitle}".

The introduction should:
- Hook the reader immediately with a question or statement that grabs attention
- Be clear and concise, stating what the article will cover
- Use a conversational but professional tone, as if written by a real person
- Include the focus keyword: "${outline.focusKeyword}"
- Be written in HTML format with proper tags (<p>, <strong>, <em>, etc.)
 - Keep it short (100-150 words), but impactful

Return ONLY the HTML content, no markdown or explanations.`;

  const client2 = getOpenAI();
  const summaryCompletion = await client2.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert blog content writer." },
      { role: "user", content: summaryPrompt },
    ],
    temperature: 0.7,
  });

  const summary = summaryCompletion.choices[0].message.content || "";
  console.log("✅ [Blog Generator] Introduction generated");

  // ========================================================================
  // STEP 3: Generate detailed content for each section
  // ========================================================================
  console.log("📝 [Blog Generator] Step 3: Generating section content...");

  const headings: HeadingItem[] = [];

  // Helper to extract summary from previous content
  const getPreviousContentSummary = (headings: HeadingItem[]): string => {
    if (headings.length === 0) return "";
    return headings.map(h => {
      const plainText = h.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const words = plainText.split(/\s+/).slice(0, 100).join(' ');
      return `• ${h.text}: ${words}${plainText.split(/\s+/).length > 100 ? '...' : ''}`;
    }).join('\n');
  };

  for (const section of outline.outline) {
    // Generate main section content
    const allHeadings = outline.outline.map((s: any, i: number) => {
      const subs = s.subsections ? s.subsections.map((sub: any) => sub.heading).join(", ") : "";
      const subText = subs ? ` (subsections: ${subs})` : "";
      return `${s.level === 2 ? "H2" : "H3"}: ${s.heading}${subText}`;
    }).join("\n");

    // Get summaries of previously generated sections
    const previousContentSummary = getPreviousContentSummary(headings);
    const previousContext = previousContentSummary ? `\n\nAlready written in earlier sections:\n${previousContentSummary}` : "";

    const sectionPrompt = `Write detailed, high-quality content (300-400 words) for the section: "${section.heading}"

CONTEXT - This is ONE section of a complete blog post. Here's the FULL structure:
${allHeadings}${previousContext}

This section: "${section.heading}"
Parent topic: "${topic}"

Key points to cover:
${section.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

Requirements:
- Write in HTML format with proper tags (<p>, <ul>, <li>, <strong>, <em>, etc.)
- Include the focus keyword "${outline.focusKeyword}" naturally if relevant
- Write in a way that feels natural, with short, conversational paragraphs (2-3 sentences each)
- Include bullet points or numbered lists where appropriate
- Be informative and actionable
- Avoid overuse of keywords or robotic phrasing
- Use a professional but conversational tone
- Provide actionable insights, examples, and relatable information

IMPORTANT - COHERENCE:
- This section is part of a larger blog post - ensure content flows naturally
- Don't repeat what's covered in other sections - add unique value here
- Reference the overall topic and how this section fits in
- Do NOT include FAQs in the content - FAQs are generated separately in a dedicated step
- Brand mentions should be limited - max 3 times TOTAL in the entire article

Return ONLY the HTML content, no heading tags (those are separate), no markdown.`;

    const client3 = getOpenAI();
    const sectionCompletion = await client3.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert blog content writer." },
        { role: "user", content: sectionPrompt },
      ],
      temperature: 0.7,
    });

    // Clean up any markdown code blocks
    let sectionContent = sectionCompletion.choices[0].message.content || "";
    sectionContent = sectionContent.replace(/```html\n?/g, "");
    sectionContent = sectionContent.replace(/```\n?/g, "");
    sectionContent = sectionContent.replace(/<!DOCTYPE[^>]*>/gi, "");
    sectionContent = sectionContent.replace(/<\/html[^>]*>/gi, "");
    sectionContent = sectionContent.replace(/<head[^>]*>[^<]*<\/head>/gi, "");
    sectionContent = sectionContent.replace(/<body[^>]*>|<\/body>/gi, "");
    sectionContent = sectionContent.replace(/<title>[^<]*<\/title>/gi, "");
    sectionContent = sectionContent.replace(/<meta[^>]*>/gi, "");
    sectionContent = sectionContent.trim();

    headings.push({
      id: generateId(),
      level: section.level,
      text: section.heading,
      content: sectionContent,
    });

    // Generate subsection content if exists
    if (section.subsections) {
      for (const subsection of section.subsections) {
        const allHeadings = outline.outline.map((s: any) => {
          const subs = s.subsections ? s.subsections.map((sub: any) => sub.heading).join(", ") : "";
          const subText = subs ? ` (subsections: ${subs})` : "";
          return `${s.level === 2 ? "H2" : "H3"}: ${s.heading}${subText}`;
        }).join("\n");

        // Get summaries of previously generated sections
        const previousContentSummary = getPreviousContentSummary(headings);
        const previousContext = previousContentSummary ? `\n\nAlready written in earlier sections:\n${previousContentSummary}` : "";

        const subPrompt = `Write focused content (150-200 words) for the subsection: "${subsection.heading}"

CONTEXT - FULL BLOG STRUCTURE:
${allHeadings}${previousContext}

Parent section: "${section.heading}"
Blog topic: "${topic}"

Key points:
${subsection.keyPoints.map((p: string, i: number) => `${i + 1}. ${p}`).join("\n")}

Requirements:
- HTML format only
- Be specific and detailed
- Include examples where relevant
- Short paragraphs
- Professional tone
- This subsection is part of section "${section.heading}" - ensure it supports that section
- Don't repeat what's already covered in other sections

Return ONLY HTML content.`;

        const client4 = getOpenAI();
        const subCompletion = await client4.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an expert blog content writer.",
            },
            { role: "user", content: subPrompt },
          ],
          temperature: 0.7,
        });

        // Clean up any markdown code blocks
        let subContent = subCompletion.choices[0].message.content || "";
        subContent = subContent.replace(/```html\n?/g, "");
        subContent = subContent.replace(/```\n?/g, "");
        subContent = subContent.replace(/<!DOCTYPE[^>]*>/gi, "");
        subContent = subContent.replace(/<\/html[^>]*>/gi, "");
        subContent = subContent.replace(/<head[^>]*>[^<]*<\/head>/gi, "");
        subContent = subContent.replace(/<body[^>]*>|<\/body>/gi, "");
        subContent = subContent.replace(/<title>[^<]*<\/title>/gi, "");
        subContent = subContent.replace(/<meta[^>]*>/gi, "");
        subContent = subContent.trim();

        headings.push({
          id: generateId(),
          level: subsection.level,
          text: subsection.heading,
          content: subContent,
        });
      }
    }

    console.log(`   ✓ Generated: ${section.heading}`);
  }

  console.log(`✅ [Blog Generator] Generated ${headings.length} sections`);

  // ========================================================================
  // STEP 4: Generate conclusion
  // ========================================================================
  console.log("🎯 [Blog Generator] Step 4: Generating conclusion...");

  const conclusionPrompt = `Write a powerful conclusion (100-150 words) for the blog post titled "${outline.seoTitle}".

The conclusion should:
- Summarize the key takeaways in a way that feels natural and not forced
- Include a call-to-action or next steps for the reader
- End on a positive, actionable note
- Include the focus keyword: "${outline.focusKeyword}" naturally
- Write in HTML format with proper tags

Return ONLY the HTML content.`;

  const client5 = getOpenAI();
  const conclusionCompletion = await client5.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert blog content writer." },
      { role: "user", content: conclusionPrompt },
    ],
    temperature: 0.7,
  });

  const conclusion = conclusionCompletion.choices[0].message.content || "";
  console.log("✅ [Blog Generator] Conclusion generated");

  // ========================================================================
  // STEP 5: Generate FAQ answers
  // ========================================================================
  console.log("❓ [Blog Generator] Step 5: Generating FAQs...");

  const faqs: FAQItem[] = [];

  for (const question of outline.faqQuestions) {
    const faqPrompt = `Provide a clear, concise answer (50-80 words) to this question: "${question}"

Context: This is for a blog post about "${topic}"

Requirements:
- Provide a direct, helpful answer without being overly technical
- Plain text (no HTML needed for FAQs)
- Include the focus keyword "${outline.focusKeyword}" if naturally relevant
- Be informative, accurate, and specific, without sounding robotic

Return ONLY the answer text.`;

    const client6 = getOpenAI();
    const faqCompletion = await client6.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert answering questions clearly and concisely.",
        },
        { role: "user", content: faqPrompt },
      ],
      temperature: 0.6,
    });

    faqs.push({
      id: generateId(),
      question: question,
      answer: faqCompletion.choices[0].message.content || "",
    });

    console.log(`   ✓ FAQ: ${question}`);
  }

  console.log(`✅ [Blog Generator] Generated ${faqs.length} FAQs`);

  // ========================================================================
  // STEP 6: Compile HTML
  // ========================================================================
  console.log("🔨 [Blog Generator] Step 6: Compiling final HTML...");

  let compiledHtml = "";

  // Add title
  compiledHtml += `<h1 class="text-4xl font-bold mb-6">${outline.seoTitle}</h1>\n\n`;

  // Add summary
  compiledHtml += `<div class="bg-orange-50 p-6 rounded-xl mb-8 border-l-4 border-orange-500">\n`;
  compiledHtml += `  <p><strong>📝 Summary:</strong></p>\n`;
  compiledHtml += `  ${summary}\n`;
  compiledHtml += `</div>\n\n`;

  // Add table of contents
  compiledHtml += `<nav class="bg-gray-50 p-6 rounded-xl mb-8">\n`;
  compiledHtml += `  <h3 class="font-bold mb-3">📑 Table of Contents</h3>\n`;
  compiledHtml += `  <ul class="space-y-2">\n`;
  headings.forEach((h, i) => {
    const indent = h.level > 2 ? 'class="ml-4"' : "";
    compiledHtml += `    <li ${indent}><a href="#section-${i + 1}" class="text-orange-600 hover:underline">${stripHtml(h.text)}</a></li>\n`;
  });
  compiledHtml += `  </ul>\n</nav>\n\n`;

  // Add sections
  headings.forEach((heading, index) => {
    compiledHtml += `<h${heading.level} id="section-${index + 1}" class="font-bold mt-10 mb-4">${heading.text}</h${heading.level}>\n`;
    compiledHtml += `<div class="mb-6 leading-relaxed">${heading.content}</div>\n\n`;
  });

  // Add conclusion
  compiledHtml += `<div class="bg-gray-900 text-white p-6 rounded-xl mt-10">\n`;
  compiledHtml += `  <h3 class="font-bold text-xl mb-3">🎯 Conclusion</h3>\n`;
  compiledHtml += `  <div>${conclusion}</div>\n`;
  compiledHtml += `</div>\n\n`;

  // Add FAQs
  compiledHtml += `<div class="mt-10">\n`;
  compiledHtml += `  <h3 class="font-bold text-2xl mb-6">❓ Frequently Asked Questions</h3>\n`;
  compiledHtml += `  <div class="space-y-4">\n`;
  faqs.forEach((faq) => {
    compiledHtml += `    <details class="bg-gray-50 rounded-lg p-4">\n`;
    compiledHtml += `      <summary class="font-semibold cursor-pointer">${faq.question}</summary>\n`;
    compiledHtml += `      <p class="mt-3 text-gray-600">${faq.answer}</p>\n`;
    compiledHtml += `    </details>\n`;
  });
  compiledHtml += `  </div>\n</div>\n\n`;

  // Add tags
  compiledHtml += `<div class="mt-10 pt-6 border-t flex flex-wrap gap-2">\n`;
  outline.tags.forEach((tag: string) => {
    compiledHtml += `  <span class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">#${tag}</span>\n`;
  });
  compiledHtml += `</div>\n`;

  // ========================================================================
  // STEP 7: Generate anchors/auto-links
  // ========================================================================
  const anchors: Anchor[] = outline.suggestedAnchors.map((anchor: any) => ({
    id: generateId(),
    keyword: anchor.keyword,
    url: "", // User will need to fill these in
  }));

  // ========================================================================
  // STEP 8: Generate featured image data
  // ========================================================================
  const mediaLibrary: MediaItem[] = [
    {
      id: generateId(),
      type: "image",
      url: `https://placehold.co/1200x600/fe9a00/fff?text=${encodeURIComponent(outline.imageSearchTerms[0] || topic)}`,
      alt: `${topic} - Featured Image`,
      caption: `Illustration for ${outline.seoTitle}`,
    },
  ];

  // ========================================================================
  // STEP 9: Calculate metrics
  // ========================================================================
  const plainText = stripHtml(compiledHtml);
  const wordCount = countWords(plainText);
  const readingTime = calculateReadingTime(plainText);

  // ========================================================================
  // STEP 10: Assemble final blog data
  // ========================================================================
  const blogData: BlogPostData = {
    content: {
      topic,
      summary,
      headings,
      conclusion,
      faqs,
      tableOfContents: true,
      compiledHtml,
    },
    seo: {
      seoTitle: outline.seoTitle,
      seoDescription: outline.seoDescription,
      focusKeyword: outline.focusKeyword,
      canonicalUrl: "",
      tags: outline.tags,
      author: "AI Content Generator",
      publishDate: currentDate,
      anchors,
    },
    media: {
      mediaLibrary,
      featuredImage: mediaLibrary[0].url,
    },
    status: "draft",
    wordCount,
    readingTime,
    seoScore: 0, // Will be calculated by model
  };

  console.log("✅ [Blog Generator] Content generation complete!");
  console.log(`   - Word count: ${wordCount}`);
  console.log(`   - Reading time: ${readingTime} min`);
  console.log(`   - Sections: ${headings.length}`);
  console.log(`   - FAQs: ${faqs.length}`);

  return blogData;
}

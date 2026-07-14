// ============================================================================
// BLOG CONTENT COMPILER
// ============================================================================
// Compiles all blog content parts into a single HTML document

/**
 * Compiles all blog content into a complete HTML document
 * @param headings - Array of heading objects with content
 * @param summary - Summary HTML content
 * @param conclusion - Conclusion HTML content
 * @param faqs - Array of FAQ objects
 * @returns Complete HTML string
 */
export function compileFullBlogHTML(
  headings: any[],
  summary: string,
  conclusion: string,
  faqs: any[]
): string {
  let html = '';

  // Add summary section
  if (summary) {
    html += `<section class="blog-summary">\n${summary}\n</section>\n\n`;
  }

  // Add all heading content
  headings.forEach((heading) => {
    if (heading.content) {
      const headingTag = `h${heading.level}`;
      html += `<section id="${heading.id}" class="blog-section">\n`;
      html += `<${headingTag}>${heading.text}</${headingTag}>\n`;
      html += `${heading.content}\n`;
      html += `</section>\n\n`;
    }
  });

  // Add conclusion section
  if (conclusion) {
    html += `<section class="blog-conclusion">\n${conclusion}\n</section>\n\n`;
  }

  // Add FAQ section
  if (faqs && faqs.length > 0) {
    html += `<section class="blog-faqs">\n`;
    html += `<h2>Frequently Asked Questions</h2>\n`;
    html += `<div class="faq-list">\n`;
    
    faqs.forEach((faq) => {
      html += `  <div class="faq-item" id="${faq.id}">\n`;
      html += `    <h3 class="faq-question">${faq.question}</h3>\n`;
      html += `    <div class="faq-answer">\n`;
      html += `      <p>${faq.answer}</p>\n`;
      html += `    </div>\n`;
      html += `  </div>\n`;
    });
    
    html += `</div>\n`;
    html += `</section>\n`;
  }

  return html;
}

/**
 * Calculate word count from HTML content
 * @param html - HTML string
 * @returns Word count
 */
export function calculateWordCount(html: string): number {
  // Strip HTML tags
  const text = html.replace(/<[^>]*>/g, ' ');
  // Remove extra whitespace
  const cleanText = text.replace(/\s+/g, ' ').trim();
  // Count words
  const words = cleanText.split(' ').filter(word => word.length > 0);
  return words.length;
}

/**
 * Calculate estimated reading time
 * @param wordCount - Total word count
 * @param wordsPerMinute - Average reading speed (default 200)
 * @returns Reading time in minutes
 */
export function calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Create a URL-friendly slug from text
 * @param text - Text to slugify
 * @returns URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

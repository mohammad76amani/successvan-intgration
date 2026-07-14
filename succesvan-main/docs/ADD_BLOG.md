AI Blog Builder - Complete Documentation
Overview
AI Blog Builder is a comprehensive, SEO-optimized blog post creation tool built with React, TypeScript, and TipTap editor. It provides a professional content management interface with real-time preview, media management, and AI-powered content generation.

Technology Stack
React 18+
TypeScript 5+
TipTap Editor 2+
Tailwind CSS
React Hot Toast
React Icons (Feather Icons)
Key Features
✅ Rich text editor with 30+ formatting options
✅ AI-powered content generation
✅ Real-time SEO analysis with scoring system
✅ Media library management (images & videos)
✅ Responsive preview (desktop/tablet/mobile)
✅ Auto-link system for keyword-based linking
✅ FAQ management with Q&A pairs
✅ Auto-generated table of contents
✅ HTML export functionality
✅ Content quality analyzer
Installation & Setup
Step 1: Install Core Dependencies
Bash

npm install react react-dom typescript
npm install react-hot-toast react-icons
Step 2: Install TipTap Core
Bash

npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-text-style
Step 3: Install TipTap Extensions
Bash

npm install @tiptap/extension-link \
 @tiptap/extension-color \
 @tiptap/extension-highlight \
 @tiptap/extension-text-align \
 @tiptap/extension-underline \
 @tiptap/extension-placeholder \
 @tiptap/extension-image \
 @tiptap/extension-horizontal-rule \
 @tiptap/extension-bullet-list \
 @tiptap/extension-ordered-list \
 @tiptap/extension-list-item \
 @tiptap/extension-subscript \
 @tiptap/extension-superscript \
 @tiptap/extension-table \
 @tiptap/extension-table-row \
 @tiptap/extension-table-cell \
 @tiptap/extension-table-header \
 @tiptap/extension-task-list \
 @tiptap/extension-task-item \
 @tiptap/extension-blockquote \
 @tiptap/extension-code-block \
 @tiptap/extension-mention
Step 4: Basic Implementation
React

import AIBlogBuilder from './components/AIBlogBuilder';

function App() {
return (
<div className="min-h-screen">
<AIBlogBuilder />
</div>
);
}

export default App;
Data Structures
BlogPostData Interface
TypeScript

interface BlogPostData {
// SEO & Metadata
topic: string; // AI generation input
seoTitle: string; // Page title (30-60 chars recommended)
seoDescription: string; // Meta description (120-160 chars)
focusKeyword: string; // Primary SEO keyword
canonicalUrl: string; // Canonical URL
tags: string[]; // Content tags

// Author Information
author: string; // Author name
publishDate: string; // ISO date format

// Content Sections
headings: HeadingItem[]; // Main content sections
summary: string; // Introduction (HTML)
conclusion: string; // Conclusion section (HTML)
faqs: FAQItem[]; // FAQ items

// Media & Links
mediaLibrary: MediaItem[]; // Uploaded media files
anchors: Anchor[]; // Auto-link keywords

// Settings & Output
tableOfContents: boolean; // Enable/disable TOC
compiledHtml: string; // Final HTML output
}
HeadingItem Interface
TypeScript

interface HeadingItem {
id: string; // Unique identifier (auto-generated)
level: number; // Heading level (2-6 for H2-H6)
text: string; // Heading text (HTML allowed for formatting)
content: string; // Section content (full HTML)
}
MediaItem Interface
TypeScript

interface MediaItem {
id: string; // Unique identifier
type: "image" | "video"; // Media type
url: string; // File URL (blob or remote)
alt: string; // Alt text for accessibility
caption?: string; // Optional caption
filename?: string; // Original filename
size?: number; // File size in bytes
}
Anchor Interface
TypeScript

interface Anchor {
id: string; // Unique identifier
keyword: string; // Text to match in content
url: string; // Link destination
}
FAQItem Interface
TypeScript

interface FAQItem {
id: string; // Unique identifier
question: string; // FAQ question
answer: string; // FAQ answer
}
ContentIssue Interface
TypeScript

interface ContentIssue {
type: "error" | "warning" | "info" | "success";
section: string; // Section name (e.g., "Title", "Meta Description")
message: string; // Issue description
suggestion?: string; // Optional improvement suggestion
}
Component Architecture
Main Component Structure
text

AIBlogBuilder
├── Header
│ ├── Logo & Title
│ └── Action Buttons (Preview, Export, Save)
│
├── Sidebar (Left - lg:col-span-3)
│ ├── AI Generator Card
│ │ ├── Topic TextArea
│ │ └── Generate Button
│ ├── ContentIssuesPanel
│ │ ├── Score Display (0-100%)
│ │ ├── Issues List
│ │ └── Passed Checks
│ └── Stats Cards
│ ├── Word Count
│ └── Media Count
│
└── Main Content Area (lg:col-span-9)
├── Tab Navigation
│ ├── Content Tab
│ ├── SEO Tab
│ └── Media Tab
│
├── Content Tab
│ ├── Blog Title Input
│ ├── Summary Editor (RichTextEditor)
│ ├── Content Sections (Repeatable)
│ │ └── ContentSection Component
│ │ ├── Section Number Badge
│ │ ├── Up/Down Move Buttons
│ │ ├── Heading Level Selector (H2-H6)
│ │ ├── HeadingEditor
│ │ ├── Collapse/Expand Toggle
│ │ ├── RichTextEditor
│ │ └── Delete Button
│ ├── Add Section Button
│ ├── Conclusion Editor (RichTextEditor)
│ └── FAQ Section
│ ├── FAQItem (Repeatable)
│ └── Add FAQ Button
│
├── SEO Tab
│ ├── Meta Description TextArea
│ ├── Focus Keyword Input
│ ├── Author Input
│ ├── Publish Date Input
│ ├── Tags Manager
│ │ ├── Tag Input
│ │ ├── Add Button
│ │ └── Tag List (removable)
│ └── Auto-Links Section
│ ├── Anchor Items (Repeatable)
│ └── Add Auto-Link Button
│
└── Media Tab
└── Media Library Grid
├── Upload Button
└── MediaItem Cards (Repeatable)
Core Features & Implementation

1. Rich Text Editor (RichTextEditor Component)
   Full Toolbar Capabilities:

Basic Formatting
Bold (Ctrl+B)
Italic (Ctrl+I)
Underline (Ctrl+U)
Strikethrough
Font Customization
Font Size Dropdown (8 sizes: 12px - 36px)
Text Color Picker (90+ colors)
Highlight Color Picker (36+ colors)
Text Alignment
Left
Center
Right
Justify
Lists
Bullet List
Numbered List
Task List (with checkboxes)
Special Formatting
Blockquote
Code Block
Horizontal Rule
Advanced Features
Tables (resizable, add/delete rows/columns)
Emoji Picker (300+ emojis)
Image/Video Insertion
Hyperlinks (with new tab option)
@Mentions (autocomplete)
Subscript/Superscript
Props:

TypeScript

interface RichTextEditorProps {
content: string;
onChange: (html: string) => void;
placeholder?: string;
minHeight?: string;
showFullToolbar?: boolean;
onOpenMediaPicker?: (type: "image" | "video" | "all") => void;
}
Usage Example:

React

<RichTextEditor
content={data.summary}
onChange={(html) => setData({ ...data, summary: html })}
placeholder="Write your summary..."
minHeight="120px"
showFullToolbar={true}
onOpenMediaPicker={(type) => openMediaPicker(type)}
/> 2. AI Content Generation
Function Implementation:

TypeScript

const handleAIGenerate = async () => {
if (!data.topic) {
toast.error("Please enter a topic first");
return;
}

setLoading(true);

try {
// Simulate AI API call (replace with actual API)
await new Promise(resolve => setTimeout(resolve, 2500));

    const generatedContent: Partial<BlogPostData> = {
      seoTitle: `${data.topic}: Complete Guide for 2024`,
      seoDescription: `Learn everything about ${data.topic}. Expert tips and best practices.`,
      focusKeyword: data.topic.toLowerCase().split(" ")[0],
      tags: [data.topic, "Guide", "Tutorial", "2024"],
      author: "AI Writer",
      summary: `This guide covers everything about ${data.topic}.`,

      headings: [
        {
          id: generateId(),
          level: 2,
          text: `What is ${data.topic}?`,
          content: `<p><strong>${data.topic}</strong> is essential in today's world.</p>`
        },
        {
          id: generateId(),
          level: 2,
          text: "Key Benefits",
          content: `<p>Benefits include:</p><ul><li>Improved efficiency</li><li>Better results</li></ul>`
        },
        {
          id: generateId(),
          level: 3,
          text: "Best Practices",
          content: `<p>Focus on <mark>quality</mark> over quantity.</p>`
        }
      ],

      conclusion: `${data.topic} is transformative when implemented correctly.`,

      faqs: [{
        id: generateId(),
        question: `How to learn ${data.topic}?`,
        answer: "Start with fundamentals and practice regularly."
      }],

      mediaLibrary: [{
        id: generateId(),
        type: "image",
        url: `https://placehold.co/1200x600/fe9a00/fff?text=${encodeURIComponent(data.topic)}`,
        alt: data.topic
      }],

      anchors: [{
        id: generateId(),
        keyword: "efficiency",
        url: "https://example.com/efficiency"
      }]
    };

    setData(prev => ({ ...prev, ...generatedContent }));
    toast.success("🎉 Content generated!");

} catch (error) {
toast.error("Generation failed");
} finally {
setLoading(false);
}
};
Generated Content Includes:

SEO-optimized title (with current year)
Meta description (120-160 characters)
Focus keyword extraction
3-5 content sections with headings
Formatted content with lists and emphasis
Conclusion paragraph
1-3 FAQ items
Featured image placeholder
Auto-link suggestions 3. SEO Analysis System
Analysis Criteria:

Check Optimal Range Type
Title Length 30-60 characters High Priority
Meta Description 120-160 characters High Priority
Focus Keyword Present in title High Priority
Word Count 300+ words (600+ ideal) Medium Priority
Section Count 2-3+ sections Medium Priority
Media Files 1+ images/videos Low Priority
Tags 3+ tags Low Priority
Summary 50+ characters Low Priority
Conclusion 50+ characters Low Priority
Score Calculation:

TypeScript

const calculateScore = (issues: ContentIssue[]): number => {
const successCount = issues.filter(i => i.type === "success").length;
const totalChecks = issues.length;
return Math.round((successCount / totalChecks) \* 100);
};

// Score Interpretation:
// 80-100% = Excellent (Green)
// 60-79% = Good (Yellow)
// 0-59% = Needs Work (Red)
Issue Types:

TypeScript

// ❌ Error - Critical issues
{
type: "error",
section: "Title",
message: "Blog title is missing",
suggestion: "Add a compelling title between 30-60 characters"
}

// ⚠️ Warning - Improvements needed
{
type: "warning",
section: "Title",
message: "Title is too short (25 chars)",
suggestion: "Aim for 30-60 characters"
}

// ℹ️ Info - Optional suggestions
{
type: "info",
section: "Links",
message: "No auto-links configured",
suggestion: "Add internal/external links"
}

// ✅ Success - Passed checks
{
type: "success",
section: "Title",
message: "Title length is optimal"
} 4. Media Management System
Upload Handler:

TypeScript

const handleMediaUpload = (file: File) => {
// 1. Type Validation
const isVideo = file.type.startsWith("video/");
const isImage = file.type.startsWith("image/");

if (!isImage && !isVideo) {
toast.error("Only images and videos are allowed");
return;
}

// 2. Size Validation (5MB limit)
const maxSize = 5 _ 1024 _ 1024;
if (file.size > maxSize) {
toast.error(`File must be under ${formatFileSize(maxSize)}`);
return;
}

// 3. Create Object URL
const url = URL.createObjectURL(file);

// 4. Create Media Item
const newMedia: MediaItem = {
id: generateId(),
type: isVideo ? "video" : "image",
url,
alt: file.name,
filename: file.name,
size: file.size
};

// 5. Add to Library
setData(prev => ({
...prev,
mediaLibrary: [...prev.mediaLibrary, newMedia]
}));

toast.success(`${isVideo ? "Video" : "Image"} uploaded!`);
};
Features:

Drag & drop support
Click to browse
File type filtering (images/videos)
File size validation (5MB limit)
Preview thumbnails
Alt text support
Delete functionality
Quick insertion into editor 5. Auto-Link System
How It Works:

TypeScript

// During HTML compilation, keywords are automatically converted to links
data.anchors.forEach(anchor => {
if (anchor.keyword && anchor.url) {
// Use word boundary regex (matches whole words only)
const regex = new RegExp(`\\b${anchor.keyword}\\b`, "gi");

    // Replace with link
    content = content.replace(
      regex,
      `<a href="${anchor.url}" class="text-orange-600 hover:underline" target="_blank">${anchor.keyword}</a>`
    );

}
});
Best Practices:

✅ Good Auto-Links:

TypeScript

[
{ keyword: "React documentation", url: "https://react.dev" },
{ keyword: "TypeScript handbook", url: "https://typescriptlang.org" },
{ keyword: "MDN Web Docs", url: "https://developer.mozilla.org" }
]
❌ Bad Auto-Links:

TypeScript

[
{ keyword: "here", url: "..." }, // Too generic
{ keyword: "click", url: "..." }, // Too generic
{ keyword: "the", url: "..." } // Will match everywhere
] 6. HTML Compilation System
Compilation Process:

TypeScript

const compileContent = useCallback(() => {
let html = "";

// 1. Title
if (data.seoTitle) {
html += `<h1 class="text-4xl font-bold mb-6">${data.seoTitle}</h1>\n`;
}

// 2. Author & Date Metadata
if (data.author || data.publishDate) {
html += `<div class="flex gap-4 text-sm text-gray-500 mb-8">\n`;
if (data.author) html += `  <span>👤 ${data.author}</span>\n`;
if (data.publishDate) html += `  <span>📅 ${new Date(data.publishDate).toLocaleDateString()}</span>\n`;
html += `  <span>⏱️ ${calculateReadingTime(stripHtml(data.headings.map(h => h.content).join(" ")))} min read</span>\n`;
html += `</div>\n\n`;
}

// 3. Featured Image
const featuredImage = data.mediaLibrary.find(m => m.type === "image");
if (featuredImage) {
html += `<img src="${featuredImage.url}" alt="${featuredImage.alt}" class="w-full rounded-xl mb-8" />\n\n`;
}

// 4. Summary
if (data.summary) {
html += `<div class="bg-orange-50 p-6 rounded-xl mb-8 border-l-4 border-orange-500">\n`;
html += `  <p><strong>📝 Summary:</strong> ${data.summary}</p>\n`;
html += `</div>\n\n`;
}

// 5. Table of Contents
if (data.tableOfContents && data.headings.filter(h => h.text).length > 0) {
html += `<nav class="bg-gray-50 p-6 rounded-xl mb-8">\n`;
html += `  <h3 class="font-bold mb-3">📑 Table of Contents</h3>\n`;
html += `  <ul class="space-y-2">\n`;
data.headings.forEach((h, i) => {
if (h.text) {
const indent = h.level > 2 ? 'class="ml-4"' : '';
html += `    <li ${indent}><a href="#section-${i + 1}" class="text-orange-600 hover:underline">${stripHtml(h.text)}</a></li>\n`;
}
});
html += `  </ul>\n</nav>\n\n`;
}

// 6. Content Sections with Auto-Links
data.headings.forEach((heading, index) => {
if (!heading.text && !heading.content) return;

    // Add heading with anchor ID
    if (heading.text) {
      html += `<h${heading.level} id="section-${index + 1}" class="font-bold mt-10 mb-4">${heading.text}</h${heading.level}>\n`;
    }

    // Apply auto-links to content
    let sectionContent = heading.content || "";
    data.anchors.forEach(anchor => {
      if (anchor.keyword && anchor.url) {
        const regex = new RegExp(`\\b${anchor.keyword}\\b`, "gi");
        sectionContent = sectionContent.replace(
          regex,
          `<a href="${anchor.url}" class="text-orange-600 hover:underline" target="_blank">${anchor.keyword}</a>`
        );
      }
    });

    if (sectionContent) {
      html += `<div class="mb-6 leading-relaxed">${sectionContent}</div>\n\n`;
    }

});

// 7. Conclusion
if (data.conclusion) {
html += `<div class="bg-gray-900 text-white p-6 rounded-xl mt-10">\n`;
html += `  <h3 class="font-bold text-xl mb-3">🎯 Conclusion</h3>\n`;
html += `  <div>${data.conclusion}</div>\n`;
html += `</div>\n\n`;
}

// 8. FAQs
if (data.faqs.filter(f => f.question && f.answer).length > 0) {
html += `<div class="mt-10">\n`;
html += `  <h3 class="font-bold text-2xl mb-6">❓ FAQ</h3>\n`;
html += `  <div class="space-y-4">\n`;
data.faqs.forEach(faq => {
if (faq.question && faq.answer) {
html += `    <details class="bg-gray-50 rounded-lg p-4">\n`;
html += `      <summary class="font-semibold cursor-pointer">${faq.question}</summary>\n`;
html += `      <p class="mt-3 text-gray-600">${faq.answer}</p>\n`;
html += `    </details>\n`;
}
});
html += `  </div>\n</div>\n\n`;
}

// 9. Tags
if (data.tags.length > 0) {
html += `<div class="mt-10 pt-6 border-t flex flex-wrap gap-2">\n`;
data.tags.forEach(tag => {
html += `  <span class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">#${tag}</span>\n`;
});
html += `</div>\n`;
}

setData(prev => ({ ...prev, compiledHtml: html }));
}, [data]);

// Auto-compile with debouncing
useEffect(() => {
const timer = setTimeout(() => compileContent(), 500);
return () => clearTimeout(timer);
}, [compileContent]);
Utility Functions
generateId()
Generates unique identifiers for all items.

TypeScript

const generateId = (): string =>
`id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Example output: "id-1701234567890-k3x9m2p1q"
calculateReadingTime()
Estimates reading time based on 200 words per minute.

TypeScript

const calculateReadingTime = (text: string): number => {
const words = text.trim().split(/\s+/).length;
return Math.max(1, Math.ceil(words / 200));
};

// Example: 1000 words = 5 minutes
countWords()
Counts words in text content.

TypeScript

const countWords = (text: string): number => {
return text
.trim()
.split(/\s+/)
.filter(word => word.length > 0)
.length;
};
stripHtml()
Removes HTML tags from content.

TypeScript

const stripHtml = (html: string): string => {
if (typeof window === "undefined") {
return html.replace(/<[^>]\*>/g, "");
}
const tmp = document.createElement("div");
tmp.innerHTML = html;
return tmp.textContent || tmp.innerText || "";
};

// Example: "<p>Hello <strong>World</strong></p>" → "Hello World"
formatFileSize()
Converts bytes to human-readable format.

TypeScript

const formatFileSize = (bytes: number): string => {
if (bytes === 0) return "0 Bytes";
const k = 1024;
const sizes = ["Bytes", "KB", "MB", "GB"];
const i = Math.floor(Math.log(bytes) / Math.log(k));
return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Examples:
// 1024 → "1 KB"
// 1536000 → "1.46 MB"
Custom TipTap Extensions
FontSize Extension
TypeScript

const FontSize = Extension.create({
name: "fontSize",

addOptions() {
return { types: ["textStyle"] };
},

addGlobalAttributes() {
return [{
types: this.options.types,
attributes: {
fontSize: {
default: null,
parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ""),
renderHTML: attributes => {
if (!attributes.fontSize) return {};
return { style: `font-size: ${attributes.fontSize}` };
}
}
}
}];
},

addCommands() {
return {
setFontSize: (fontSize: string) => ({ chain }: any) => {
return chain().setMark("textStyle", { fontSize }).run();
},
unsetFontSize: () => ({ chain }: any) => {
return chain()
.setMark("textStyle", { fontSize: null })
.removeEmptyTextStyle()
.run();
}
};
}
});
Usage:

TypeScript

// Set font size
editor.chain().focus().setFontSize("24px").run();

// Remove font size
editor.chain().focus().unsetFontSize().run();

// Get current size
const currentSize = editor.getAttributes("textStyle").fontSize;
Editor Commands Reference
Text Formatting
TypeScript

// Bold
editor.chain().focus().toggleBold().run();

// Italic
editor.chain().focus().toggleItalic().run();

// Underline
editor.chain().focus().toggleUnderline().run();

// Strikethrough
editor.chain().focus().toggleStrike().run();

// Subscript
editor.chain().focus().toggleSubscript().run();

// Superscript
editor.chain().focus().toggleSuperscript().run();
Font & Color
TypeScript

// Font size
editor.chain().focus().setFontSize("24px").run();

// Text color
editor.chain().focus().setColor("#ff0000").run();

// Highlight
editor.chain().focus().setHighlight({ color: "#ffff00" }).run();
Alignment
TypeScript

editor.chain().focus().setTextAlign("left").run();
editor.chain().focus().setTextAlign("center").run();
editor.chain().focus().setTextAlign("right").run();
editor.chain().focus().setTextAlign("justify").run();
Lists
TypeScript

// Bullet list
editor.chain().focus().toggleBulletList().run();

// Numbered list
editor.chain().focus().toggleOrderedList().run();

// Task list
editor.chain().focus().toggleTaskList().run();
Special Elements
TypeScript

// Blockquote
editor.chain().focus().toggleBlockquote().run();

// Code block
editor.chain().focus().toggleCodeBlock().run();

// Horizontal rule
editor.chain().focus().setHorizontalRule().run();
Tables
TypeScript

// Insert table
editor.chain().focus().insertTable({
rows: 3,
cols: 3,
withHeaderRow: true
}).run();

// Add column
editor.chain().focus().addColumnBefore().run();
editor.chain().focus().addColumnAfter().run();

// Add row
editor.chain().focus().addRowBefore().run();
editor.chain().focus().addRowAfter().run();

// Delete
editor.chain().focus().deleteColumn().run();
editor.chain().focus().deleteRow().run();
editor.chain().focus().deleteTable().run();
Links
TypeScript

// Set link
editor.chain().focus().setLink({
href: "https://example.com",
target: "\_blank"
}).run();

// Remove link
editor.chain().focus().unsetLink().run();

// Check if active
editor.isActive("link"); // true/false
Media
TypeScript

// Insert image
editor.chain().focus().setImage({
src: "image.jpg",
alt: "Description"
}).run();

// Insert HTML (for video)
editor.chain().focus().insertContent(`  <video controls>
    <source src="video.mp4" type="video/mp4">
  </video>`).run();
Selection & Content
TypeScript

// Get selected text
const { from, to } = editor.state.selection;
const text = editor.state.doc.textBetween(from, to);

// Select all
editor.chain().focus().selectAll().run();

// Insert content
editor.chain().focus().insertContent("Hello World").run();

// Get HTML
const html = editor.getHTML();

// Set content
editor.commands.setContent("<p>New content</p>");

// Clear content
editor.commands.clearContent();
Configuration Constants
Font Sizes
TypeScript

const FONT_SIZES = [
{ label: "XS", value: "12px" },
{ label: "SM", value: "14px" },
{ label: "Base", value: "16px" },
{ label: "LG", value: "18px" },
{ label: "XL", value: "20px" },
{ label: "2XL", value: "24px" },
{ label: "3XL", value: "30px" },
{ label: "4XL", value: "36px" }
];
Device Sizes
TypeScript

const DEVICE_SIZES: Record<DeviceType, { width: number; label: string }> = {
desktop: { width: 1280, label: "Desktop" },
tablet: { width: 768, label: "Tablet" },
mobile: { width: 375, label: "Mobile" }
};
Color Palettes
TypeScript

// 90+ text colors including:
const TEXT_COLORS = [
"#000000", "#ffffff", // Black & White
"#ef4444", "#f97316", "#eab308", // Red, Orange, Yellow
"#22c55e", "#06b6d4", "#3b82f6", // Green, Cyan, Blue
"#8b5cf6", "#d946ef", // Purple, Pink
// ... and many more
];

// 36+ highlight colors
const BG_COLORS = [
"#fef08a", "#fed7aa", "#bbf7d0", // Yellow, Orange, Green
"#a5f3fc", "#bfdbfe", "#c4b5fd", // Cyan, Blue, Purple
// ... and more
];
Emoji List
TypeScript

// 300+ emojis including:
const EMOJI_LIST = [
"😀", "😃", "😄", "😁", "😅", // Smileys
"👍", "👎", "👊", "✋", "🙏", // Gestures
"❤️", "💙", "💚", "💛", "💜", // Hearts
"🎯", "🎨", "🎬", "🎤", "🎧", // Objects
// ... and many more
];
Mention Suggestions
TypeScript

const MENTION_SUGGESTIONS = [
"John Doe",
"Jane Smith",
"Alice Johnson",
"Bob Williams",
"Charlie Brown",
"David Lee",
"Emma Davis",
"Frank Miller",
"Grace Wilson",
"Henry Moore"
];
Example Data
Complete Blog Post Example
TypeScript

const exampleBlogPost: BlogPostData = {
// SEO & Metadata
topic: "React Hooks",
seoTitle: "Complete Guide to React Hooks: useState, useEffect & More",
seoDescription: "Learn React Hooks with practical examples. Master useState, useEffect, and create custom hooks. Includes code samples and best practices.",
focusKeyword: "react hooks",
canonicalUrl: "https://yourblog.com/react-hooks-guide",
tags: ["React", "Hooks", "JavaScript", "Web Development", "Frontend"],

// Author Info
author: "Jane Developer",
publishDate: "2024-01-15",

// Content
headings: [
{
id: generateId(),
level: 2,
text: "What Are React Hooks?",
content: "<p><strong>React Hooks</strong> are functions that let you use state and other React features in functional components.</p>"
},
{
id: generateId(),
level: 3,
text: "useState Hook",
content: "<p>The <code>useState</code> hook allows you to add state to functional components.</p><ul><li>Easy to use</li><li>Clean syntax</li></ul>"
},
{
id: generateId(),
level: 3,
text: "useEffect Hook",
content: "<p>The <code>useEffect</code> hook lets you perform side effects in functional components.</p>"
}
],

summary: "<p>This comprehensive guide covers everything you need to know about React Hooks.</p>",
conclusion: "<p>React Hooks have revolutionized how we write React components. Start using them today!</p>",

faqs: [
{
id: generateId(),
question: "What are React Hooks?",
answer: "React Hooks are functions that let you use state and lifecycle features in functional components."
},
{
id: generateId(),
question: "Can I use Hooks in class components?",
answer: "No, Hooks only work in functional components."
}
],

// Media
mediaLibrary: [
{
id: generateId(),
type: "image",
url: "https://example.com/react-hooks-diagram.png",
alt: "React Hooks lifecycle diagram",
filename: "hooks-diagram.png",
size: 245760
}
],

// Auto-links
anchors: [
{
id: generateId(),
keyword: "React documentation",
url: "https://react.dev"
},
{
id: generateId(),
keyword: "useState",
url: "https://react.dev/reference/react/useState"
}
],

// Settings
tableOfContents: true,
compiledHtml: ""
};
Best Practices
SEO Optimization
✅ Good Example:

TypeScript

{
seoTitle: "Complete Guide to React Hooks: useState, useEffect & Custom Hooks",
seoDescription: "Learn React Hooks with practical examples. Master useState, useEffect, and create custom hooks. Includes code samples and best practices for modern React development.",
focusKeyword: "react hooks",
tags: ["React", "Hooks", "JavaScript", "Web Development"],
canonicalUrl: "https://yourblog.com/react-hooks-guide"
}
❌ Bad Example:

TypeScript

{
seoTitle: "Hooks", // Too short
seoDescription: "Learn hooks", // Way too short
focusKeyword: "", // Missing
tags: [], // No tags
canonicalUrl: ""
}
Content Structure
✅ Good Structure:

TypeScript

[
{ level: 2, text: "Introduction", content: "..." },
{ level: 2, text: "Main Concept", content: "..." },
{ level: 3, text: "Subtopic A", content: "..." },
{ level: 3, text: "Subtopic B", content: "..." },
{ level: 2, text: "Advanced Topics", content: "..." }
]
❌ Bad Structure:

TypeScript

[
{ level: 2, text: "Part 1", content: "..." },
{ level: 5, text: "Random", content: "..." }, // Skips levels!
{ level: 6, text: "Detail", content: "..." } // Bad hierarchy
]
Media Usage
✅ Good Media:

TypeScript

{
type: "image",
url: "/images/react-diagram.png",
alt: "React component lifecycle diagram showing useState and useEffect hooks interaction",
caption: "How useState and useEffect work together",
size: 245760 // 240 KB
}
❌ Bad Media:

TypeScript

{
type: "image",
url: "/img1.jpg",
alt: "image", // Not descriptive
size: 8388608 // 8 MB - too large!
}
Auto-Links
✅ Good Auto-Links:

TypeScript

[
{ keyword: "React documentation", url: "https://react.dev" },
{ keyword: "TypeScript handbook", url: "https://typescriptlang.org" }
]
❌ Bad Auto-Links:

TypeScript

[
{ keyword: "here", url: "..." }, // Too generic
{ keyword: "click", url: "..." }, // Too generic
{ keyword: "the", url: "..." } // Will match everywhere
]
Performance
✅ Use Debouncing:

TypeScript

useEffect(() => {
const timer = setTimeout(() => {
compileContent(); // Expensive operation
}, 500); // Wait 500ms after last change

return () => clearTimeout(timer);
}, [data]);
❌ Don't Compile on Every Keystroke:

TypeScript

onChange={(e) => {
setData({ ...data, content: e.target.value });
compileContent(); // Too frequent!
}}
State Management
✅ Immutable Updates:

TypeScript

setData(prev => ({
...prev,
headings: prev.headings.map((h, i) =>
i === index ? { ...h, ...updates } : h
)
}));
❌ Mutating State:

TypeScript

const newData = data;
newData.headings[index] = updates;
setData(newData); // Won't trigger re-render!
Troubleshooting
Issue: Editor Not Updating
Problem: Content changes but editor doesn't reflect them.

Solution:

TypeScript

useEffect(() => {
if (editor && content !== editor.getHTML()) {
editor.commands.setContent(content);
}
}, [content, editor]);
Issue: Tables Not Working
Problem: Table insert button doesn't work.

Solution:

TypeScript

// Ensure ALL table extensions are imported
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

// All must be in extensions array
extensions: [
Table.configure({ resizable: true }),
TableRow,
TableCell,
TableHeader
]
Issue: Auto-Links Not Working
Problem: Keywords not being converted to links.

Solution:

TypeScript

// Use word boundaries in regex
const regex = new RegExp(`\\b${anchor.keyword}\\b`, "gi");

// Ensure compilation is triggered
useEffect(() => {
const timer = setTimeout(() => compileContent(), 500);
return () => clearTimeout(timer);
}, [data]);
Issue: Preview Not Showing Styles
Problem: Preview looks unstyled.

Solution:

TypeScript

const generateFullHTML = () => `

<!DOCTYPE html>
<html>
<head>
  <!-- Include Tailwind CSS -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
</head>
<body>${data.compiledHtml}</body>
</html>
`;
Issue: Media Upload Fails
Problem: Files not uploading.

Solution:

TypeScript

const handleMediaUpload = (file: File) => {
// Check file exists
if (!file) {
toast.error("No file selected");
return;
}

// Validate type
const validTypes = ["image/jpeg", "image/png", "image/gif", "video/mp4"];
if (!validTypes.includes(file.type)) {
toast.error(`Invalid type. Accepted: ${validTypes.join(", ")}`);
return;
}

// Validate size (5MB)
if (file.size > 5 _ 1024 _ 1024) {
toast.error("File too large (max 5MB)");
return;
}

// Process...
};
Issue: Performance Issues
Problem: App is slow/laggy.

Solutions:

TypeScript

// 1. Debounce expensive operations
useEffect(() => {
const timer = setTimeout(() => compileContent(), 500);
return () => clearTimeout(timer);
}, [data]);

// 2. Memoize calculations
const wordCount = useMemo(() =>
countWords(stripHtml(data.compiledHtml)),
[data.compiledHtml]
);

// 3. Use useCallback
const handleUpdate = useCallback((index: number, updates: Partial<HeadingItem>) => {
setData(prev => ({
...prev,
headings: prev.headings.map((h, i) => i === index ? { ...h, ...updates } : h)
}));
}, []);
Testing Checklist
Core Functionality
AI content generation works
Content sections can be added/removed
Sections can be reordered (up/down)
Headings render correctly (H2-H6)
Rich text formatting works
Media upload works (images & videos)
Media can be inserted into content
Links can be inserted
Tables can be created/edited
Lists work (bullet/numbered/task)
Emojis can be inserted
Auto-links are applied correctly
SEO Features
SEO score calculates correctly
Title length validation works
Meta description validation works
Focus keyword detection works
Tags can be added/removed
Auto-links can be configured
Content issues display correctly
Preview & Export
Preview modal opens
Desktop/tablet/mobile views work
HTML compilation is correct
Export copies to clipboard
Preview shows all content sections
Styles render correctly in preview
Table of contents generates correctly
UI/UX
All modals open/close properly
Tooltips display on hover
Loading states show during AI generation
Toast notifications appear
Color pickers work
Font size selector works
Emoji picker scrolls properly
Responsive design works on all screens
Edge Cases
Empty content doesn't break
Very long content handles well
Special characters work in titles
Large images upload correctly
Multiple sections work
No sections doesn't crash
Empty FAQs handle gracefully
No media doesn't break preview
Deployment Notes
Before Deploying
Replace Mock AI API

TypeScript

// Replace this in handleAIGenerate:
await new Promise(r => setTimeout(r, 2500));

// With actual API call:
const response = await fetch("/api/generate", {
method: "POST",
body: JSON.stringify({ topic: data.topic })
});
Add Error Boundaries

React

<ErrorBoundary fallback={<ErrorScreen />}>
<AIBlogBuilder />
</ErrorBoundary>
Optimize Bundle

Lazy load heavy components
Code split modals
Tree shake unused icons
Configure CDN for Media

Use cloud storage (S3, Cloudinary)
Implement image optimization
Add lazy loading for images
Add Analytics

Track content generation usage
Monitor editor performance
Track export functionality
Browser Support
Browser Version Status
Chrome 90+ ✅ Fully Supported
Firefox 88+ ✅ Fully Supported
Safari 14+ ✅ Fully Supported
Edge 90+ ✅ Fully Supported
Opera 76+ ✅ Fully Supported
License & Credits
Version: 1.0.0
Last Updated: January 2024
License: MIT

Dependencies
TipTap Editor - MIT License
React - MIT License
Tailwind CSS - MIT License
React Hot Toast - MIT License
React Icons - MIT License
Support & Resources
Official Documentation
TipTap Documentation
React Documentation
TypeScript Handbook
Tailwind CSS
Community
GitHub Issues: Report bugs and request features
Discord: Join the community for support
Stack Overflow: Tag with tiptap and react
End of Documentation

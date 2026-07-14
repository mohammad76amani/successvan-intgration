# Blog Backend API Documentation

## Overview
Complete backend system for AI-powered blog generation and management, integrated with OpenAI GPT-4 and MongoDB.

---

## 🗂️ File Structure

```
/root/succesvan/
├── app/api/blog/
│   ├── route.ts                    # Main CRUD operations
│   ├── [id]/route.ts               # Single blog operations
│   └── generate/route.ts           # AI content generation
├── lib/
│   └── blog-generator.ts           # OpenAI integration logic
└── model/
    └── blogs.ts                    # MongoDB schema
```

---

## 📡 API Endpoints

### 1. Generate Blog Content (AI)

**POST** `/api/blog/generate`

Generate complete blog content using OpenAI GPT-4.

**Request Body:**
```json
{
  "topic": "React Hooks Best Practices"
}
```

**Response:**
```json
{
  "success": true,
  "blogData": {
    "content": {
      "topic": "React Hooks Best Practices",
      "summary": "<p>Introduction HTML...</p>",
      "headings": [
        {
          "id": "id-1234567890-abc123",
          "level": 2,
          "text": "What Are React Hooks?",
          "content": "<p>Content HTML...</p>"
        }
      ],
      "conclusion": "<p>Conclusion HTML...</p>",
      "faqs": [
        {
          "id": "id-1234567891-def456",
          "question": "How do React Hooks work?",
          "answer": "React Hooks are functions..."
        }
      ],
      "tableOfContents": true,
      "compiledHtml": "<h1>Full HTML output...</h1>"
    },
    "seo": {
      "seoTitle": "React Hooks Best Practices: Complete Guide 2026",
      "seoDescription": "Master React Hooks with expert tips and practical examples...",
      "focusKeyword": "react hooks",
      "canonicalUrl": "",
      "tags": ["React", "Hooks", "JavaScript", "Frontend", "Web Development"],
      "author": "AI Content Generator",
      "publishDate": "2026-01-29T00:00:00.000Z",
      "anchors": [
        {
          "id": "id-1234567892-ghi789",
          "keyword": "useState",
          "url": ""
        }
      ]
    },
    "media": {
      "mediaLibrary": [
        {
          "id": "id-1234567893-jkl012",
          "type": "image",
          "url": "https://placehold.co/1200x600/fe9a00/fff?text=React+Hooks",
          "alt": "React Hooks Best Practices - Featured Image",
          "caption": "Illustration for React Hooks Best Practices"
        }
      ],
      "featuredImage": "https://placehold.co/1200x600/..."
    },
    "status": "draft",
    "wordCount": 1847,
    "readingTime": 10,
    "seoScore": 0
  },
  "message": "Blog content generated successfully"
}
```

**Error Responses:**
```json
// 400 Bad Request - Invalid input
{
  "success": false,
  "error": "Topic is required and must be a non-empty string"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to generate blog content"
}
```

---

### 2. Get All Blogs

**GET** `/api/blog`

Retrieve blogs with optional filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `published`, `archived`)
- `tag` (optional): Filter by tag
- `search` (optional): Search in title, topic, or tags
- `limit` (optional): Number of results (default: 20)
- `skip` (optional): Number to skip for pagination (default: 0)

**Examples:**
```
GET /api/blog
GET /api/blog?status=published
GET /api/blog?tag=React&limit=10
GET /api/blog?search=hooks&skip=20
```

**Response:**
```json
{
  "success": true,
  "blogs": [
    {
      "_id": "65a1b2c3d4e5f6789012345",
      "content": { ... },
      "seo": { ... },
      "media": { ... },
      "status": "published",
      "slug": "react-hooks-best-practices-complete-guide-2026",
      "views": 1234,
      "readingTime": 10,
      "wordCount": 1847,
      "seoScore": 85,
      "createdAt": "2026-01-29T10:00:00.000Z",
      "updatedAt": "2026-01-29T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "skip": 0,
    "hasMore": true
  }
}
```

---

### 3. Create Blog

**POST** `/api/blog`

Create a new blog post manually (without AI generation).

**Request Body:**
```json
{
  "content": {
    "topic": "Manual Topic",
    "summary": "<p>Summary...</p>",
    "headings": [...],
    "conclusion": "<p>Conclusion...</p>",
    "faqs": [...],
    "tableOfContents": true,
    "compiledHtml": "<h1>...</h1>"
  },
  "seo": {
    "seoTitle": "My Blog Title",
    "seoDescription": "My blog description",
    "focusKeyword": "keyword",
    "tags": ["tag1", "tag2"],
    "author": "John Doe",
    "anchors": [...]
  },
  "media": {
    "mediaLibrary": [...],
    "featuredImage": "url"
  },
  "status": "draft"
}
```

**Required Fields:**
- `seo.seoTitle`
- `seo.seoDescription`

**Response:**
```json
{
  "success": true,
  "blog": { ... },
  "message": "Blog created successfully"
}
```

---

### 4. Update Blog

**PUT** `/api/blog`

Update an existing blog post.

**Request Body:**
```json
{
  "id": "65a1b2c3d4e5f6789012345",
  "content": { ... },
  "seo": { ... },
  "media": { ... },
  "status": "published"
}
```

**Response:**
```json
{
  "success": true,
  "blog": { ... },
  "message": "Blog updated successfully"
}
```

---

### 5. Get Single Blog

**GET** `/api/blog/[id]`

Get a single blog by MongoDB ID or slug. Automatically increments view count.

**Examples:**
```
GET /api/blog/65a1b2c3d4e5f6789012345
GET /api/blog/react-hooks-best-practices-complete-guide-2026
```

**Response:**
```json
{
  "success": true,
  "blog": { ... }
}
```

---

### 6. Partial Update

**PATCH** `/api/blog/[id]`

Partially update a blog (e.g., change status to published).

**Request Body:**
```json
{
  "status": "published"
}
```

**Response:**
```json
{
  "success": true,
  "blog": { ... },
  "message": "Blog updated successfully"
}
```

---

### 7. Delete Blog

**DELETE** `/api/blog?id=[id]`

Delete a blog post.

**Example:**
```
DELETE /api/blog?id=65a1b2c3d4e5f6789012345
```

**Response:**
```json
{
  "success": true,
  "message": "Blog deleted successfully"
}
```

---

## 🤖 AI Content Generation

### How It Works

The blog generator uses OpenAI GPT-4 with a multi-step process:

#### **Step 1: Generate Outline**
- Creates SEO-optimized title and description
- Plans 4-6 main sections with subsections
- Generates FAQ questions
- Suggests internal linking keywords

#### **Step 2: Generate Introduction**
- 100-150 word engaging introduction
- Includes focus keyword
- HTML formatted

#### **Step 3: Generate Section Content**
- 200-300 words per main section
- 150-200 words per subsection
- Includes bullet points, examples, and actionable insights
- HTML formatted with proper tags

#### **Step 4: Generate Conclusion**
- 100-150 word summary
- Includes call-to-action
- Reinforces focus keyword

#### **Step 5: Generate FAQ Answers**
- 50-80 words per answer
- Clear and concise
- Addresses common questions

#### **Step 6: Compile HTML**
- Assembles all parts into final HTML
- Adds table of contents
- Includes styling classes
- Adds anchor IDs for navigation

#### **Step 7-10: Metadata & Metrics**
- Generates auto-link suggestions
- Creates featured image placeholder
- Calculates word count and reading time
- Assembles final blog data structure

---

## 📊 MongoDB Model

### Schema Structure

```typescript
{
  // Content Section
  content: {
    topic: String,
    summary: String,
    headings: [{
      id: String,
      level: Number (2-6),
      text: String,
      content: String
    }],
    conclusion: String,
    faqs: [{
      id: String,
      question: String,
      answer: String
    }],
    tableOfContents: Boolean,
    compiledHtml: String
  },

  // SEO Section
  seo: {
    seoTitle: String (required),
    seoDescription: String (required),
    focusKeyword: String,
    canonicalUrl: String,
    tags: [String],
    author: String,
    publishDate: Date,
    anchors: [{
      id: String,
      keyword: String,
      url: String
    }]
  },

  // Media Section
  media: {
    mediaLibrary: [{
      id: String,
      type: "image" | "video",
      url: String,
      alt: String,
      caption: String,
      filename: String,
      size: Number
    }],
    featuredImage: String
  },

  // Metadata
  status: "draft" | "published" | "archived",
  slug: String (unique, auto-generated),
  views: Number,
  readingTime: Number,
  wordCount: Number,
  seoScore: Number (0-100),
  createdAt: Date,
  updatedAt: Date
}
```

### Auto-Calculated Fields

These fields are automatically calculated on save:

- **`slug`**: URL-friendly version of seoTitle
- **`wordCount`**: Total words in compiled HTML
- **`readingTime`**: Estimated minutes (200 words/min)
- **`seoScore`**: Quality score (0-100) based on:
  - Title length (30-60 chars) = 15 points
  - Description length (120-160 chars) = 15 points
  - Keyword in title = 15 points
  - Word count (300+) = 15 points
  - Section count (2+) = 10 points
  - Media files (1+) = 10 points
  - Tags (3+) = 10 points
  - Summary present = 5 points
  - Conclusion present = 5 points

### Model Methods

```typescript
// Calculate reading time
blog.calculateReadingTime() // Returns: number (minutes)

// Calculate word count
blog.calculateWordCount() // Returns: number

// Calculate SEO score
blog.calculateSEOScore() // Returns: { score: number, checks: string[] }

// Generate slug
blog.generateSlug() // Returns: string
```

### Indexes

For optimized queries:
- Text search on `seo.seoTitle` and `content.topic`
- Index on `seo.tags`
- Compound index on `status` + `createdAt`
- Unique index on `slug`

---

## 🔧 Frontend Integration Example

### Generate Blog with AI

```typescript
// Frontend component
const handleGenerateBlog = async (topic: string) => {
  try {
    setLoading(true);

    const response = await fetch('/api/blog/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });

    const result = await response.json();

    if (result.success) {
      // Populate form with AI-generated content
      setData(result.blogData);
      toast.success('🎉 Content generated!');
    } else {
      toast.error(result.error);
    }
  } catch (error) {
    toast.error('Failed to generate content');
  } finally {
    setLoading(false);
  }
};
```

### Save Blog

```typescript
const handleSaveBlog = async (blogData: BlogPostData) => {
  try {
    const response = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogData)
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Blog saved!');
      router.push(`/dashboard/blogs/${result.blog._id}`);
    }
  } catch (error) {
    toast.error('Failed to save blog');
  }
};
```

### Update Blog Status

```typescript
const handlePublish = async (blogId: string) => {
  try {
    const response = await fetch(`/api/blog/${blogId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' })
    });

    const result = await response.json();

    if (result.success) {
      toast.success('Blog published!');
    }
  } catch (error) {
    toast.error('Failed to publish');
  }
};
```

---

## 🔑 Environment Variables

Required in `.env.local`:

```env
# OpenAI API Key
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# MongoDB Connection
MONGODB_URI=mongodb+srv://...

# JWT Secret (if using authentication)
JWT_SECRET=your-secret-key
```

---

## ⚡ Performance Considerations

### AI Generation
- Average generation time: **30-60 seconds**
- Depends on: topic complexity, API response time
- Consider implementing: loading states, progress indicators

### Optimization Tips
1. **Cache common topics**: Store frequently requested content
2. **Batch operations**: Process multiple sections in parallel where possible
3. **Debounce saves**: Don't save on every keystroke
4. **Lazy load HTML**: Don't include `compiledHtml` in list views

---

## 🐛 Error Handling

### Common Errors

```typescript
// OpenAI Rate Limit
{
  error: "Rate limit exceeded",
  suggestion: "Wait 60 seconds and try again"
}

// Invalid Topic
{
  error: "Topic is required and must be a non-empty string",
  suggestion: "Provide a valid topic"
}

// Database Connection Failed
{
  error: "Database connection error",
  suggestion: "Check MongoDB URI in environment variables"
}

// Blog Not Found
{
  error: "Blog not found",
  suggestion: "Verify the blog ID or slug"
}
```

---

## 📈 SEO Score Breakdown

```
Score Range: 0-100

Excellent (80-100):
✅ All checks passed
✅ Ready to publish
✅ SEO optimized

Good (60-79):
⚠️ Most checks passed
⚠️ Minor improvements needed
⚠️ Consider review

Needs Work (0-59):
❌ Multiple issues
❌ Significant improvements required
❌ Review before publishing
```

---

## 🎯 Best Practices

### For AI Generation
1. **Use specific topics**: "React Hooks Best Practices" > "React"
2. **Include context**: "React Hooks for beginners 2026"
3. **Target audience**: Specify level (beginner, advanced)

### For Content Quality
1. **Review AI content**: Always review and edit generated content
2. **Add images**: Replace placeholder images with real ones
3. **Fill anchor URLs**: Add actual URLs to auto-link keywords
4. **Customize**: Personalize the generated content

### For SEO
1. **Optimize title**: Keep 50-60 characters
2. **Meta description**: 140-155 characters, compelling copy
3. **Use tags**: 5-7 relevant, searchable tags
4. **Internal linking**: Configure anchors for keyword linking
5. **Featured image**: Use high-quality, relevant images

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connected and indexed
- [ ] OpenAI API key valid and has credits
- [ ] API routes accessible
- [ ] CORS configured (if needed)
- [ ] Rate limiting implemented (recommended)
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Backup strategy for blog content

---

## 📚 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TipTap Editor](https://tiptap.dev)

---

**Last Updated:** January 29, 2026
**Version:** 1.0.0
**License:** MIT

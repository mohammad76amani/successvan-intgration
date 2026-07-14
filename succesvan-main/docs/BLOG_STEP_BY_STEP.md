# Step-by-Step Blog Generation Workflow

## 🎯 Overview

Enhanced blog generation system with **user approval at each stage**. Instead of generating everything at once, content is created step-by-step with regeneration options.

---

## 📋 Generation Flow

```
1. User Prompt
   ↓
2. Generate Headings Tree → [Approve / Regenerate]
   ↓
3. Provide Image Descriptions → Generate Images (DALL-E) → [Approve / Regenerate]
   ↓
4. Generate Content (Section by Section) → [Approve / Regenerate each]
   ↓
5. Generate Summary → [Approve / Regenerate]
   ↓
6. Generate Conclusion → [Approve / Regenerate]
   ↓
7. Generate FAQs → [Approve / Regenerate]
   ↓
8. Generate SEO Metadata → [Approve / Regenerate]
   ↓
9. ✅ Complete → Save to Database
```

---

## 🚀 API Endpoint

**POST** `/api/blog/generate-step`

Single endpoint that handles all steps based on `step` and `action` parameters.

---

## 📝 Step-by-Step Implementation

### **Step 1: Generate Headings Tree**

**Request:**
```json
{
  "step": "headings",
  "action": "generate",
  "prompt": "Complete Guide to React Hooks for Beginners"
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "headings",
  "data": {
    "headings": [
      {
        "id": "id-1234567890-abc123",
        "level": 2,
        "text": "What Are React Hooks?",
        "content": ""
      },
      {
        "id": "id-1234567891-def456",
        "level": 3,
        "text": "Understanding useState",
        "content": ""
      },
      {
        "id": "id-1234567892-ghi789",
        "level": 2,
        "text": "Common Use Cases",
        "content": ""
      }
    ],
    "suggestedTitle": "Complete Guide to React Hooks: Beginner's Tutorial 2026",
    "focusKeyword": "react hooks"
  },
  "message": "Headings tree generated. Please review and approve or regenerate.",
  "nextStep": "images"
}
```

**User Actions:**
- ✅ **Approve**: `{ "step": "headings", "action": "approve", "blogId": "..." }`
- 🔄 **Regenerate**: `{ "step": "headings", "action": "regenerate", "blogId": "...", "prompt": "..." }`

---

### **Step 2: Image Generation**

#### **2a. Save Image Descriptions (Optional)**

User can provide custom descriptions for each H1/H2 heading:

**Request:**
```json
{
  "step": "images",
  "action": "save-descriptions",
  "blogId": "65a1b2c3d4e5f6789012345",
  "imageDescriptions": {
    "id-1234567890-abc123": "A colorful diagram showing React hooks lifecycle",
    "id-1234567892-ghi789": "Developer using React hooks in a modern IDE"
  }
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "images",
  "message": "Image descriptions saved. Generate images when ready.",
  "nextStep": "content"
}
```

#### **2b. Generate Single Image**

**POST** `/api/blog/generate-image`

**Request:**
```json
{
  "blogId": "65a1b2c3d4e5f6789012345",
  "headingId": "id-1234567890-abc123",
  "description": "Optional custom description"
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "headingId": "id-1234567890-abc123",
  "mediaItem": {
    "id": "img-1234567890-xyz",
    "type": "image",
    "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
    "alt": "What Are React Hooks? - Illustration",
    "caption": "What Are React Hooks?",
    "filename": "what-are-react-hooks.png"
  },
  "message": "Image generated successfully"
}
```

#### **2c. Batch Generate Images**

**PUT** `/api/blog/generate-image` (batch endpoint)

**Request:**
```json
{
  "blogId": "65a1b2c3d4e5f6789012345",
  "headingIds": ["id-123...", "id-456..."],
  "descriptions": {
    "id-123...": "Custom description 1"
  }
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "results": [
    { "headingId": "id-123...", "mediaItem": {...} },
    { "headingId": "id-456...", "mediaItem": {...} }
  ],
  "errors": [],
  "message": "Generated 2 images"
}
```

**Notes:**
- Only H1 and H2 headings get images
- Images generated sequentially (1-second delay between each)
- Uses DALL-E 3 model (1792x1024 resolution)
- First image becomes featured image

---

### **Step 3: Generate Section Content**

Generate content for each heading **one at a time**.

**Request:**
```json
{
  "step": "content",
  "action": "generate",
  "blogId": "65a1b2c3d4e5f6789012345",
  "headingIndex": 0
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "content",
  "headingIndex": 0,
  "data": {
    "heading": {
      "id": "id-1234567890-abc123",
      "level": 2,
      "text": "What Are React Hooks?",
      "content": "<p>React Hooks are functions that let you...</p>"
    }
  },
  "message": "Content generated for: What Are React Hooks?",
  "isLastHeading": false,
  "nextStep": "content"
}
```

**User Actions:**
- ✅ **Approve**: `{ "step": "content", "action": "approve", "blogId": "...", "headingIndex": 0 }`
- 🔄 **Regenerate**: `{ "step": "content", "action": "regenerate", "blogId": "...", "headingIndex": 0 }`

**After approving, repeat for next heading:**
```json
{
  "step": "content",
  "action": "generate",
  "blogId": "65a1b2c3d4e5f6789012345",
  "headingIndex": 1
}
```

Continue until `isLastHeading: true`, then move to summary.

---

### **Step 4: Generate Summary**

**Request:**
```json
{
  "step": "summary",
  "action": "generate",
  "blogId": "65a1b2c3d4e5f6789012345"
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "summary",
  "data": {
    "summary": "<p>This comprehensive guide will teach you...</p>"
  },
  "message": "Summary generated. Please review and approve or regenerate.",
  "nextStep": "conclusion"
}
```

**User Actions:**
- ✅ **Approve**: `{ "step": "summary", "action": "approve", "blogId": "..." }`
- 🔄 **Regenerate**: `{ "step": "summary", "action": "regenerate", "blogId": "..." }`

---

### **Step 5: Generate Conclusion**

**Request:**
```json
{
  "step": "conclusion",
  "action": "generate",
  "blogId": "65a1b2c3d4e5f6789012345"
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "conclusion",
  "data": {
    "conclusion": "<p>React Hooks have revolutionized how we...</p>"
  },
  "message": "Conclusion generated. Please review and approve or regenerate.",
  "nextStep": "faq"
}
```

**User Actions:**
- ✅ **Approve**: `{ "step": "conclusion", "action": "approve", "blogId": "..." }`
- 🔄 **Regenerate**: `{ "step": "conclusion", "action": "regenerate", "blogId": "..." }`

---

### **Step 6: Generate FAQs**

**Request:**
```json
{
  "step": "faq",
  "action": "generate",
  "blogId": "65a1b2c3d4e5f6789012345"
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "faq",
  "data": {
    "faqs": [
      {
        "id": "faq-1234567890-abc",
        "question": "What are React Hooks?",
        "answer": "React Hooks are functions that..."
      },
      {
        "id": "faq-1234567891-def",
        "question": "Can I use Hooks in class components?",
        "answer": "No, Hooks only work in functional components."
      }
    ]
  },
  "message": "FAQs generated. Please review and approve or regenerate.",
  "nextStep": "seo"
}
```

**User Actions:**
- ✅ **Approve**: `{ "step": "faq", "action": "approve", "blogId": "..." }`
- 🔄 **Regenerate**: `{ "step": "faq", "action": "regenerate", "blogId": "..." }`

---

### **Step 7: Generate SEO Metadata**

**Request:**
```json
{
  "step": "seo",
  "action": "generate",
  "blogId": "65a1b2c3d4e5f6789012345"
}
```

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "seo",
  "data": {
    "seo": {
      "seoDescription": "Master React Hooks with our complete beginner's guide. Learn useState, useEffect, and custom hooks with practical examples.",
      "tags": ["React", "Hooks", "JavaScript", "Frontend", "Web Development", "Tutorial", "Beginner"],
      "author": "Content Team",
      "anchors": [
        {
          "id": "anchor-123",
          "keyword": "React documentation",
          "url": ""
        },
        {
          "id": "anchor-456",
          "keyword": "useState hook",
          "url": ""
        }
      ],
      "publishDate": "2026-01-29T..."
    }
  },
  "message": "SEO metadata generated. Please review and approve or regenerate.",
  "nextStep": "completed"
}
```

**User Actions:**
- ✅ **Approve**: `{ "step": "seo", "action": "approve", "blogId": "..." }` → **Completes generation**
- 🔄 **Regenerate**: `{ "step": "seo", "action": "regenerate", "blogId": "..." }`

---

### **Step 8: Completion**

When SEO is approved, the system:
1. Compiles final HTML
2. Marks generation as complete
3. Returns full blog data

**Response:**
```json
{
  "success": true,
  "blogId": "65a1b2c3d4e5f6789012345",
  "step": "completed",
  "message": "Blog generation completed! All content approved.",
  "blog": {
    "content": { ... },
    "seo": { ... },
    "media": { ... },
    "generationProgress": {
      "currentStep": "completed",
      "headingsApproved": true,
      "imagesApproved": true,
      "contentApproved": [true, true, true, ...],
      "summaryApproved": true,
      "conclusionApproved": true,
      "faqApproved": true,
      "seoApproved": true
    }
  }
}
```

---

## 🎨 Image Generation Details

### DALL-E Configuration

```typescript
{
  model: "dall-e-3",
  size: "1792x1024",      // Wide format for blog headers
  quality: "standard",     // Use "hd" for higher quality
  style: "vivid",         // "vivid" or "natural"
}
```

### Image Prompt Generation

1. **User provides description** → Use directly
2. **No description** → GPT generates optimized DALL-E prompt

**Example Optimized Prompt:**
```
"Professional illustration showing React hooks lifecycle, modern digital 
art style, clean and minimalist design, bright inviting colors, high detail, 
no text, suitable for blog header"
```

### Cost Considerations

- DALL-E 3 Standard: ~$0.040 per image (1792x1024)
- DALL-E 3 HD: ~$0.080 per image
- Average blog with 5 H1/H2 headings: ~$0.20-$0.40 per blog

### Rate Limiting

- 1-second delay between batch image generations
- Sequential processing to avoid API rate limits

---

## 💾 Database Schema Changes

### New `generationProgress` Field

```typescript
generationProgress: {
  currentStep: "headings" | "images" | "content" | "summary" | 
               "conclusion" | "faq" | "seo" | "completed",
  currentHeadingIndex: Number,
  headingsApproved: Boolean,
  imagesApproved: Boolean,
  contentApproved: [Boolean],  // Array for each heading
  summaryApproved: Boolean,
  conclusionApproved: Boolean,
  faqApproved: Boolean,
  seoApproved: Boolean,
  imageDescriptions: Map<String, String>
}
```

### SEO Fields Now Optional

All `seo` fields are now optional (default: `""`) to support incremental saving.

---

## 🔄 Frontend Integration Example

```typescript
// Component state
const [currentStep, setCurrentStep] = useState("headings");
const [blogId, setBlogId] = useState<string | null>(null);
const [headingIndex, setHeadingIndex] = useState(0);
const [data, setData] = useState<any>(null);

// Step 1: Generate headings
const handleGenerateHeadings = async (prompt: string) => {
  const response = await fetch('/api/blog/generate-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: "headings",
      action: "generate",
      prompt
    })
  });

  const result = await response.json();
  
  if (result.success) {
    setBlogId(result.blogId);
    setData(result.data);
    setCurrentStep("headings");
  }
};

// User approves headings
const handleApproveHeadings = async () => {
  const response = await fetch('/api/blog/generate-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: "headings",
      action: "approve",
      blogId
    })
  });

  const result = await response.json();
  
  if (result.success) {
    setCurrentStep("images");
    // Show image description inputs
  }
};

// Generate single section content
const handleGenerateContent = async (index: number) => {
  const response = await fetch('/api/blog/generate-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: "content",
      action: "generate",
      blogId,
      headingIndex: index
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Update specific heading content
    const newData = { ...data };
    newData.headings[index] = result.data.heading;
    setData(newData);
  }
};

// Approve and move to next
const handleApproveContent = async (index: number) => {
  const response = await fetch('/api/blog/generate-step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      step: "content",
      action: "approve",
      blogId,
      headingIndex: index
    })
  });

  const result = await response.json();
  
  if (result.isLastHeading) {
    setCurrentStep("summary");
  } else {
    setHeadingIndex(index + 1);
    // Auto-generate next section
    handleGenerateContent(index + 1);
  }
};

// Similar patterns for summary, conclusion, faq, seo...
```

---

## 🎯 UI/UX Recommendations

### Step Indicator
```
[✓] Headings → [○] Images → [○] Content (0/5) → [○] Summary → 
[○] Conclusion → [○] FAQs → [○] SEO → [○] Complete
```

### Action Buttons for Each Step
```
[✓ Approve & Continue]  [🔄 Regenerate]  [✏️ Edit Manually]
```

### Progress Tracking
```
Content Generation: Section 3 of 5
━━━━━━━━━━░░░░░░░░░░ 60%
```

### Auto-save Indicator
```
💾 Saving... → ✓ Saved at 10:34 AM
```

---

## ⚡ Performance Tips

1. **Auto-generation**: After approval, auto-trigger next step generation
2. **Parallel loading**: Show current content while generating next
3. **Optimistic updates**: Update UI immediately, sync in background
4. **Debounce manual edits**: Save changes after 2 seconds of inactivity
5. **Cache responses**: Store generated content locally to avoid re-fetch

---

## 🐛 Error Handling

### OpenAI Rate Limit
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please wait 60 seconds.",
  "retryAfter": 60
}
```

### Invalid Step Transition
```json
{
  "success": false,
  "error": "Cannot approve images before approving headings"
}
```

### Generation Failure
```json
{
  "success": false,
  "error": "Content generation failed",
  "step": "content",
  "headingIndex": 2,
  "canRetry": true
}
```

---

## 📊 Estimated Generation Times

| Step | Time | API Calls |
|------|------|-----------|
| Headings | 3-5s | 1 |
| Images (each) | 15-20s | 2 (prompt + image) |
| Content (each) | 4-8s | 1 |
| Summary | 3-5s | 1 |
| Conclusion | 3-5s | 1 |
| FAQs | 4-7s | 1 |
| SEO | 3-5s | 1 |

**Total for 5-section blog with 3 images: ~90-150 seconds**

---

## 🔐 Environment Variables

```env
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://...
```

---

**Last Updated:** January 29, 2026  
**Version:** 2.0.0 (Step-by-Step Enhancement)

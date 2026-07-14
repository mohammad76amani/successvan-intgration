import { NextRequest, NextResponse } from "next/server";
import { generateBlogContent } from "@/lib/blog-generator";
import {
  generateHeadingsTree,
  generateSectionContent,
  generateSummary,
  generateConclusion,
  generateFAQs,
  generateSEOMetadata,
} from "@/lib/blog-step-generator";
import {
  compileFullBlogHTML,
  calculateWordCount,
  calculateReadingTime,
  slugify
} from "@/lib/blog-compiler";
import { generateAnchorURLs } from "@/lib/anchor-generator";
import Blog from "@/model/blogs";
import connect from "@/lib/data";

/**
 * POST /api/blog/generate
 * Unified blog generation endpoint
 * 
 * Supports two modes:
 * 1. All-at-once: Generate complete blog in one request (mode: "full")
 * 2. Step-by-step: Generate with approval gates (mode: "step")
 * 
 * Body for full mode: { mode: "full", topic: string }
 * Body for step mode: { mode: "step", step: string, action: string, blogId?: string, ... }
 */
export async function POST(request: NextRequest) {
  console.log("🤖 [Blog Generator API] Received generation request");

  try {
    await connect();

    // Drop old 'id' index if it exists (legacy cleanup)
    try {
      const collection = Blog.collection;
      const indexes = await collection.indexes();
      const hasIdIndex = indexes.some((idx: any) => idx.name === 'id_1');
      if (hasIdIndex) {
        await collection.dropIndex('id_1');
        console.log("🧹 [Blog Generator] Dropped legacy 'id_1' index");
      }
    } catch (indexError) {
      // Index doesn't exist or already dropped, continue
      console.log("ℹ️ [Blog Generator] No legacy index to drop");
    }

    const body = await request.json();
    const { mode = "full" } = body;

    // ========================================================================
    // MODE 1: FULL GENERATION (All at once)
    // ========================================================================
    if (mode === "full") {
      const { topic } = body;

      // Validate input
      if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Topic is required and must be a non-empty string" },
          { status: 400 }
        );
      }

      if (topic.length > 200) {
        return NextResponse.json(
          { success: false, error: "Topic is too long (max 200 characters)" },
          { status: 400 }
        );
      }

      console.log("📝 [Blog Generator] Full generation mode for topic:", topic);

      const blogData = await generateBlogContent(topic);

      console.log("✅ [Blog Generator] Content generated successfully");
      console.log(`   - Title: ${blogData.seo.seoTitle}`);
      console.log(`   - Sections: ${blogData.content.headings.length}`);
      console.log(`   - FAQs: ${blogData.content.faqs.length}`);
      console.log(`   - Word count: ${blogData.wordCount}`);

      return NextResponse.json({
        success: true,
        mode: "full",
        blogData,
        message: "Blog content generated successfully"
      });
    }

    // ========================================================================
    // MODE 2: STEP-BY-STEP GENERATION
    // ========================================================================
    if (mode === "step") {
      const {
        blogId,
        step,
        action,
        prompt,
        headingIndex,
        imageDescriptions
      } = body;

      console.log("🤖 [Step Generator] Received step-by-step generation request:", { step, prompt, action, blogId });
      // --------------------------------------------------------------------
      // STEP 1: GENERATE HEADINGS TREE
      // --------------------------------------------------------------------
      if (step === "headings" && (action === "generate" || action === "regenerate")) {
        if (!prompt) {
          return NextResponse.json(
            { success: false, error: "Prompt is required for headings generation" },
            { status: 400 }
          );
        }

        console.log("📋 [Step Generator] Generating headings tree for:", prompt);

        const headingsData = await generateHeadingsTree(prompt);

        let blog;
        if (blogId) {
          blog = await Blog.findById(blogId);
          if (!blog) {
            return NextResponse.json(
              { success: false, error: "Blog not found" },
              { status: 404 }
            );
          }
          blog.content.topic = prompt;
          blog.content.headings = headingsData.headings;
          blog.seo.seoTitle = headingsData.suggestedTitle;
          blog.seo.focusKeyword = headingsData.focusKeyword;
          blog.generationProgress.currentStep = "headings";
          blog.generationProgress.headingsApproved = false;
        } else {
          blog = new Blog({
            content: {
              topic: prompt,
              headings: headingsData.headings,
            },
            seo: {
              seoTitle: headingsData.suggestedTitle,
              focusKeyword: headingsData.focusKeyword,
            },
            generationProgress: {
              currentStep: "headings",
              headingsApproved: false,
            },
            status: "draft"
          });
        }

        await blog.save();

        console.log(`✅ [Step Generator] Headings generated: ${blog._id}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "headings",
          data: {
            headings: headingsData.headings,
            suggestedTitle: headingsData.suggestedTitle,
            focusKeyword: headingsData.focusKeyword,
          },
          message: "Headings tree generated. Please review and approve or regenerate.",
          nextStep: "images"
        });
      }

      // --------------------------------------------------------------------
      // STEP 1.5: APPROVE HEADINGS
      // --------------------------------------------------------------------
      if (step === "headings" && action === "approve") {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        blog.generationProgress.headingsApproved = true;
        blog.generationProgress.currentStep = "images";
        await blog.save();

        console.log(`✅ [Step Generator] Headings approved for: ${blogId}`);
        console.log(`   Total headings in database: ${blog.content.headings.length}`);
        console.log(`   Heading levels: ${blog.content.headings.map((h: any) => `${h.text} (L${h.level})`).join(', ')}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "images",
          message: "Headings approved. Ready for image generation.",
          data: {
            headings: blog.content.headings, // Return ALL headings, not filtered
          },
          nextStep: "images"
        });
      }

      // --------------------------------------------------------------------
      // STEP 2: SAVE IMAGE DESCRIPTIONS
      // --------------------------------------------------------------------
      if (step === "images" && action === "save-descriptions") {
        if (!blogId || !imageDescriptions) {
          return NextResponse.json(
            { success: false, error: "Blog ID and image descriptions are required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        blog.generationProgress.imageDescriptions = new Map(Object.entries(imageDescriptions));
        await blog.save();

        console.log(`✅ [Step Generator] Image descriptions saved for: ${blogId}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "images",
          message: "Image descriptions saved. Generate images when ready.",
          nextStep: "content"
        });
      }

      // --------------------------------------------------------------------
      // STEP 3: GENERATE CONTENT FOR SPECIFIC HEADING
      // --------------------------------------------------------------------
      if (step === "content" && (action === "generate" || action === "regenerate")) {
        if (!blogId || headingIndex === undefined) {
          return NextResponse.json(
            { success: false, error: "Blog ID and heading index are required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        // Validate heading index is within range
        if (headingIndex < 0 || headingIndex >= blog.content.headings.length) {
          console.log(`❌ [Step Generator] Invalid heading index ${headingIndex}. Total headings: ${blog.content.headings.length}`);
          return NextResponse.json(
            { 
              success: false, 
              error: `Invalid heading index ${headingIndex}. Valid range: 0-${blog.content.headings.length - 1}`,
              totalHeadings: blog.content.headings.length
            },
            { status: 400 }
          );
        }

        console.log(`📝 [Step Generator] Generating content for heading ${headingIndex}`);
        console.log(`   Topic: ${blog.content.topic}`);
        console.log(`   Total headings: ${blog.content.headings.length}`);
        console.log(`   Progress: ${headingIndex + 1}/${blog.content.headings.length}`);
        console.log(`   Heading text: ${blog.content.headings[headingIndex]?.text}`);
        console.log(`   Heading level: ${blog.content.headings[headingIndex]?.level}`);
        console.log(`   Focus keyword: ${blog.seo.focusKeyword}`);

        const heading = blog.content.headings[headingIndex];
        const content = await generateSectionContent(
          blog.content.topic,
          heading.text,
          heading.level,
          blog.seo.focusKeyword,
          blog.content.headings,
          headingIndex
        );

        console.log(`🔍 [Step Generator] Generated content length: ${content?.length || 0} characters`);
        console.log(`🔍 [Step Generator] Content preview: ${content?.substring(0, 100)}...`);

        // Preserve existing content (e.g., images) and append new content
        const existingContent = blog.content.headings[headingIndex].content || "";
        const hasImage = existingContent.includes('<figure') || existingContent.includes('<img');
        
        // If heading already has content with image, append new content after the image
        let newContent;
        if (hasImage) {
          // Extract existing content and append new content
          newContent = existingContent + content;
          console.log(`🔍 [Step Generator] Preserving existing image, appending new content`);
        } else {
          // No existing content, use new content
          newContent = content;
        }

        // Mark the nested document as modified to ensure Mongoose saves it
        blog.markModified('content.headings');
        blog.content.headings[headingIndex].content = newContent;
        blog.generationProgress.currentHeadingIndex = headingIndex;
        blog.generationProgress.currentStep = "content";
        blog.markModified('content.headings');
        
        console.log(`💾 [Step Generator] Saving to database...`);
        console.log(`   Heading ${headingIndex} content length before save: ${blog.content.headings[headingIndex].content?.length || 0}`);
        console.log(`   Is content truthy: ${!!blog.content.headings[headingIndex].content}`);
        console.log(`   Content type: ${typeof blog.content.headings[headingIndex].content}`);
        
        await blog.save();
        
        // Verify save by refetching
        const savedBlog = await Blog.findById(blogId);
        console.log(`✅ [Step Generator] Content generated for heading ${headingIndex}`);
        console.log(`   Verified content length in DB: ${savedBlog.content.headings[headingIndex].content?.length || 0}`);
        console.log(`   Verified content exists: ${!!savedBlog.content.headings[headingIndex].content}`);

        const responseData = {
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "content",
          headingIndex,
          data: {
            heading: savedBlog.content.headings[headingIndex],
          },
          message: `Content generated for: ${heading.text}`,
          isLastHeading: headingIndex === savedBlog.content.headings.length - 1,
          nextStep: headingIndex === savedBlog.content.headings.length - 1 ? "summary" : "content"
        };

        console.log(`📤 [Step Generator] Returning response:`, {
          ...responseData,
          data: {
            heading: {
              id: responseData.data.heading.id,
              text: responseData.data.heading.text,
              contentLength: responseData.data.heading.content?.length || 0
            }
          }
        });

        return NextResponse.json(responseData);
      }

      // --------------------------------------------------------------------
      // STEP 3.5: APPROVE HEADING CONTENT
      // --------------------------------------------------------------------
      if (step === "content" && action === "approve") {
        if (!blogId || headingIndex === undefined) {
          return NextResponse.json(
            { success: false, error: "Blog ID and heading index are required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        if (!blog.generationProgress.contentApproved) {
          blog.generationProgress.contentApproved = [];
        }
        blog.generationProgress.contentApproved[headingIndex] = true;
        await blog.save();

        console.log(`✅ [Step Generator] Content approved for heading ${headingIndex}`);
        console.log(`📤 [Step Generator] Returning heading data: ${JSON.stringify({ 
          id: blog.content.headings[headingIndex].id, 
          text: blog.content.headings[headingIndex].text, 
          contentLength: blog.content.headings[headingIndex].content?.length || 0 
        })}`);

        const isLastHeading = headingIndex === blog.content.headings.length - 1;

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "content",
          data: {
            heading: blog.content.headings[headingIndex],
          },
          message: `Content approved for heading ${headingIndex + 1}`,
          isLastHeading,
          nextStep: isLastHeading ? "summary" : "content",
          nextHeadingIndex: isLastHeading ? null : headingIndex + 1
        });
      }

      // --------------------------------------------------------------------
      // STEP 4: GENERATE SUMMARY
      // --------------------------------------------------------------------
      if (step === "summary" && (action === "generate" || action === "regenerate")) {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        console.log(`📋 [Step Generator] Generating summary for: ${blog.content.topic}`);

        const summary = await generateSummary(
          blog.content.topic,
          blog.seo.seoTitle,
          blog.seo.focusKeyword
        );

        blog.content.summary = summary;
        blog.generationProgress.currentStep = "summary";
        blog.generationProgress.summaryApproved = false;
        await blog.save();

        console.log(`✅ [Step Generator] Summary generated`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "summary",
          data: { summary },
          message: "Summary generated. Please review and approve or regenerate.",
          nextStep: "conclusion"
        });
      }

      // --------------------------------------------------------------------
      // STEP 4.5: APPROVE SUMMARY
      // --------------------------------------------------------------------
      if (step === "summary" && action === "approve") {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        blog.generationProgress.summaryApproved = true;
        blog.generationProgress.currentStep = "conclusion";
        await blog.save();

        console.log(`✅ [Step Generator] Summary approved`);
        console.log(`   Summary length: ${blog.content.summary?.length || 0}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "conclusion",
          data: {
            summary: blog.content.summary
          },
          message: "Summary approved. Ready for conclusion generation.",
          nextStep: "conclusion"
        });
      }

      // --------------------------------------------------------------------
      // STEP 5: GENERATE CONCLUSION
      // --------------------------------------------------------------------
      if (step === "conclusion" && (action === "generate" || action === "regenerate")) {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        console.log(`🎯 [Step Generator] Generating conclusion`);

        const conclusion = await generateConclusion(
          blog.content.topic,
          blog.seo.seoTitle,
          blog.seo.focusKeyword,
          blog.content.headings
        );

        blog.content.conclusion = conclusion;
        blog.generationProgress.currentStep = "conclusion";
        blog.generationProgress.conclusionApproved = false;
        await blog.save();

        console.log(`✅ [Step Generator] Conclusion generated`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "conclusion",
          data: { conclusion },
          message: "Conclusion generated. Please review and approve or regenerate.",
          nextStep: "faq"
        });
      }

      // --------------------------------------------------------------------
      // STEP 5.5: APPROVE CONCLUSION
      // --------------------------------------------------------------------
      if (step === "conclusion" && action === "approve") {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        blog.generationProgress.conclusionApproved = true;
        blog.generationProgress.currentStep = "faq";
        await blog.save();

        console.log(`✅ [Step Generator] Conclusion approved`);
        console.log(`   Conclusion length: ${blog.content.conclusion?.length || 0}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "faq",
          data: {
            conclusion: blog.content.conclusion
          },
          message: "Conclusion approved. Ready for FAQ generation.",
          nextStep: "faq"
        });
      }

      // --------------------------------------------------------------------
      // STEP 6: GENERATE FAQs
      // --------------------------------------------------------------------
      if (step === "faq" && (action === "generate" || action === "regenerate")) {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        console.log(`❓ [Step Generator] Generating FAQs`);
        console.log(`   Topic: ${blog.content.topic}`);
        console.log(`   Focus keyword: ${blog.seo.focusKeyword}`);
        console.log(`   Total headings: ${blog.content.headings.length}`);

        const faqs = await generateFAQs(
          blog.content.topic,
          blog.seo.focusKeyword,
          blog.content.headings
        );

        blog.content.faqs = faqs;
        blog.generationProgress.currentStep = "faq";
        blog.generationProgress.faqApproved = false;
        await blog.save();

        console.log(`✅ [Step Generator] FAQs generated: ${faqs.length} items`);
        console.log(`   FAQ items: ${JSON.stringify(faqs.map((f: any) => ({ question: f.question?.substring(0, 50), answerLength: f.answer?.length })))}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "faq",
          data: { faqs },
          message: "FAQs generated. Please review and approve or regenerate.",
          nextStep: "seo"
        });
      }

      // --------------------------------------------------------------------
      // STEP 6.5: APPROVE FAQs
      // --------------------------------------------------------------------
      if (step === "faq" && action === "approve") {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        blog.generationProgress.faqApproved = true;
        blog.generationProgress.currentStep = "seo";

        // Generate compiledHTML from all content parts
        console.log(`📝 [Step Generator] Compiling full blog HTML...`);
        const compiledHtml = compileFullBlogHTML(
          blog.content.headings,
          blog.content.summary,
          blog.content.conclusion,
          blog.content.faqs
        );
        blog.content.compiledHtml = compiledHtml;
        
        // Calculate word count and reading time
        const wordCount = calculateWordCount(compiledHtml);
        const readingTime = calculateReadingTime(wordCount);
        blog.wordCount = wordCount;
        blog.readingTime = readingTime;
        
        console.log(`✅ [Step Generator] Compiled HTML: ${compiledHtml.length} characters`);
        console.log(`📊 [Step Generator] Calculated metrics:`);
        console.log(`   Word count: ${wordCount}`);
        console.log(`   Reading time: ${readingTime} min`);

        await blog.save();

        console.log(`✅ [Step Generator] FAQs approved`);
        console.log(`   Total FAQs: ${blog.content.faqs?.length || 0}`);
        console.log(`   FAQ preview: ${JSON.stringify(blog.content.faqs?.map((f: any) => f.question?.substring(0, 40)) || [])}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "seo",
          data: { faqs: blog.content.faqs },
          message: "FAQs approved. Ready for SEO metadata generation.",
          nextStep: "seo"
        });
      }

      // --------------------------------------------------------------------
      // STEP 7: GENERATE SEO METADATA
      // --------------------------------------------------------------------
      if (step === "seo" && (action === "generate" || action === "regenerate")) {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        console.log(`🔍 [Step Generator] Generating SEO metadata`);
        console.log(`   Topic: ${blog.content.topic}`);
        console.log(`   SEO Title: ${blog.seo.seoTitle}`);
        console.log(`   Total headings: ${blog.content.headings.length}`);
        console.log(`   Total FAQs: ${blog.content.faqs?.length || 0}`);

        const seoData = await generateSEOMetadata(
          blog.content.topic,
          blog.seo.seoTitle,
          blog.content.headings,
          blog.content.faqs,
          blog.content.summary,
          blog.content.conclusion
        );

        // Generate canonical URL from SEO title
        const canonicalUrl = `/${slugify(blog.seo.seoTitle)}`;
        seoData.canonicalUrl = canonicalUrl;

        // Generate optimized anchor URLs using AI (internal + external)
        console.log(`🔗 [Step Generator] Generating intelligent anchor links...`);
        try {
          // Extract some content context for better anchor generation
          const contentPreview = blog.content.headings
            .map((h: any) => h.content || '')
            .join(' ')
            .replace(/<[^>]*>/g, ' ')
            .substring(0, 1000);

          const generatedAnchors = await generateAnchorURLs(
            [], // No initial anchors, let AI generate them
            blog.content.topic,
            blog.seo.focusKeyword,
            contentPreview
          );
          
          seoData.anchors = generatedAnchors;
          console.log(`   Generated ${generatedAnchors.length} anchor links`);
        } catch (error) {
          console.log(`   ⚠️ Anchor generation failed:`, error);
          seoData.anchors = []; // Fallback to empty array
        }

        blog.seo = { ...blog.seo, ...seoData };
        blog.generationProgress.currentStep = "seo";
        blog.generationProgress.seoApproved = false;
        await blog.save();

        console.log(`✅ [Step Generator] SEO metadata generated`);
        console.log(`   SEO Description length: ${seoData.seoDescription?.length || 0}`);
        console.log(`   Tags: ${seoData.tags?.length || 0}`);
        console.log(`   Anchors: ${seoData.anchors?.length || 0}`);
        console.log(`   Anchor URLs: ${seoData.anchors?.filter((a: any) => a.url !== '#').length || 0} valid`);
        console.log(`   Author: ${seoData.author || 'none'}`);
        console.log(`   Canonical URL: ${canonicalUrl}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "seo",
          data: { 
            seoDescription: seoData.seoDescription,
            tags: seoData.tags,
            author: seoData.author,
            anchors: seoData.anchors
          },
          message: "SEO metadata generated. Please review and approve or regenerate.",
          nextStep: "completed"
        });
      }

      // --------------------------------------------------------------------
      // STEP 7.5: APPROVE SEO & COMPLETE
      // --------------------------------------------------------------------
      if (step === "seo" && action === "approve") {
        if (!blogId) {
          return NextResponse.json(
            { success: false, error: "Blog ID is required" },
            { status: 400 }
          );
        }

        const blog = await Blog.findById(blogId);
        if (!blog) {
          return NextResponse.json(
            { success: false, error: "Blog not found" },
            { status: 404 }
          );
        }

        blog.generationProgress.seoApproved = true;
        blog.generationProgress.currentStep = "completed";

        // Calculate word count and reading time
        if (blog.content.compiledHtml) {
          const wordCount = calculateWordCount(blog.content.compiledHtml);
          const readingTime = calculateReadingTime(wordCount);
          
          blog.wordCount = wordCount;
          blog.readingTime = readingTime;

          console.log(`📊 [Step Generator] Calculated metrics:`);
          console.log(`   Word count: ${wordCount}`);
          console.log(`   Reading time: ${readingTime} min`);
        }

        // Compile final HTML (in case it wasn't done earlier)
        if (!blog.content.compiledHtml) {
          blog.content.compiledHtml = compileHTML(blog);
        }

        await blog.save();

        console.log(`🎉 [Step Generator] Blog generation completed: ${blogId}`);

        return NextResponse.json({
          success: true,
          mode: "step",
          blogId: blog._id,
          step: "completed",
          message: "Blog generation completed! All content approved.",
          data: {
            seoDescription: blog.seo.seoDescription,
            tags: blog.seo.tags,
            author: blog.seo.author,
            anchors: blog.seo.anchors,
            seoTitle: blog.seo.seoTitle,
            focusKeyword: blog.seo.focusKeyword,
          },
          blog: blog
        });
      }

      // Invalid step/action combination
      return NextResponse.json(
        { success: false, error: "Invalid step or action" },
        { status: 400 }
      );
    }

    // Invalid mode
    return NextResponse.json(
      { success: false, error: "Invalid mode. Use 'full' or 'step'" },
      { status: 400 }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.log("❌ [Blog Generator API] Error:", message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTION: COMPILE HTML
// ============================================================================

function compileHTML(blog: any): string {
  let html = "";

  if (blog.seo.seoTitle) {
    html += `<h1 class="text-4xl font-bold mb-6">${blog.seo.seoTitle}</h1>\n\n`;
  }

  if (blog.content.summary) {
    html += `<div class="bg-orange-50 p-6 rounded-xl mb-8 border-l-4 border-orange-500">\n`;
    html += `  <p><strong>📝 Summary:</strong></p>\n`;
    html += `  ${blog.content.summary}\n`;
    html += `</div>\n\n`;
  }

  if (blog.content.tableOfContents && blog.content.headings.length > 0) {
    html += `<nav class="bg-gray-50 p-6 rounded-xl mb-8">\n`;
    html += `  <h3 class="font-bold mb-3">📑 Table of Contents</h3>\n`;
    html += `  <ul class="space-y-2">\n`;
    blog.content.headings.forEach((h: any, i: number) => {
      const indent = h.level > 2 ? 'class="ml-4"' : '';
      html += `    <li ${indent}><a href="#section-${i + 1}" class="text-orange-600 hover:underline">${h.text}</a></li>\n`;
    });
    html += `  </ul>\n</nav>\n\n`;
  }

  blog.content.headings.forEach((heading: any, index: number) => {
    html += `<h${heading.level} id="section-${index + 1}" class="font-bold mt-10 mb-4">${heading.text}</h${heading.level}>\n`;
    if (heading.content) {
      html += `<div class="mb-6 leading-relaxed">${heading.content}</div>\n\n`;
    }
  });

  if (blog.content.conclusion) {
    html += `<div class="bg-gray-900 text-white p-6 rounded-xl mt-10">\n`;
    html += `  <h3 class="font-bold text-xl mb-3">🎯 Conclusion</h3>\n`;
    html += `  <div>${blog.content.conclusion}</div>\n`;
    html += `</div>\n\n`;
  }

  if (blog.content.faqs && blog.content.faqs.length > 0) {
    html += `<div class="mt-10">\n`;
    html += `  <h3 class="font-bold text-2xl mb-6">❓ FAQ</h3>\n`;
    html += `  <div class="space-y-4">\n`;
    blog.content.faqs.forEach((faq: any) => {
      html += `    <details class="bg-gray-50 rounded-lg p-4">\n`;
      html += `      <summary class="font-semibold cursor-pointer">${faq.question}</summary>\n`;
      html += `      <p class="mt-3 text-gray-600">${faq.answer}</p>\n`;
      html += `    </details>\n`;
    });
    html += `  </div>\n</div>\n\n`;
  }

  if (blog.seo.tags && blog.seo.tags.length > 0) {
    html += `<div class="mt-10 pt-6 border-t flex flex-wrap gap-2">\n`;
    blog.seo.tags.forEach((tag: string) => {
      html += `  <span class="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">#${tag}</span>\n`;
    });
    html += `</div>\n`;
  }

  return html;
}

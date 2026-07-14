"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  FiZap,
  FiCheck,
  FiRefreshCw,
  FiChevronRight,
  FiLoader,
  FiEdit3,
  FiImage,
  FiFileText,
  FiBookOpen,
  FiTarget,
  FiMessageSquare,
  FiGlobe,
  FiCheckCircle,
} from "react-icons/fi";
import toast from "react-hot-toast";

// ============================================================================
// TYPES
// ============================================================================

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  content: string;
  generateImage?: boolean;
}

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  s3Key?: string;
  alt: string;
  caption?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface Anchor {
  id: string;
  keyword: string;
  url: string;
}

interface GenerationProgress {
  currentStep:
    | "headings"
    | "images"
    | "content"
    | "summary"
    | "conclusion"
    | "faq"
    | "seo"
    | "completed";
  currentHeadingIndex: number;
  headingsApproved: boolean;
  imagesApproved: boolean;
  imageApproved: boolean[];
  contentApproved: boolean[];
  summaryApproved: boolean;
  conclusionApproved: boolean;
  faqApproved: boolean;
  seoApproved: boolean;
}

export interface StepGeneratorData {
  seoTitle: string;
  seoDescription: string;
  focusKeyword: string;
  tags: string[];
  author: string;
  publishDate: string;
  headings: HeadingItem[];
  canonicalUrl: string;
  summary: string;
  conclusion: string;
  faqs: FAQItem[];
  anchors: Anchor[];
  mediaLibrary: MediaItem[];
}

interface StepByStepBlogGeneratorProps {
  topic: string;
  data?: Partial<StepGeneratorData>;
  onDataUpdate: (data: Partial<StepGeneratorData>) => void;
  onComplete: () => void;
  blogId?: string; // Added for edit mode
}

type StepKey =
  | "headings"
  | "images"
  | "content"
  | "summary"
  | "conclusion"
  | "faq"
  | "seo";

interface StepInfo {
  key: StepKey;
  title: string;
  icon: React.ReactNode;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STEPS: StepInfo[] = [
  {
    key: "headings",
    title: "Generate Structure",
    icon: <FiEdit3 size={16} />,
    description: "Create blog outline with headings",
  },
  {
    key: "content",
    title: "Generate Content",
    icon: <FiFileText size={16} />,
    description: "Write section content",
  },
  {
    key: "images",
    title: "Generate Images",
    icon: <FiImage size={16} />,
    description: "Create images for headings",
  },
  {
    key: "summary",
    title: "Generate Summary",
    icon: <FiBookOpen size={16} />,
    description: "Create introduction paragraph",
  },
  {
    key: "conclusion",
    title: "Generate Conclusion",
    icon: <FiTarget size={16} />,
    description: "Write closing thoughts",
  },
  {
    key: "faq",
    title: "Generate FAQs",
    icon: <FiMessageSquare size={16} />,
    description: "Common questions & answers",
  },
  {
    key: "seo",
    title: "Generate SEO",
    icon: <FiGlobe size={16} />,
    description: "Meta tags and keywords",
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function StepByStepBlogGenerator({
  topic,
  data,
  onDataUpdate,
  onComplete,
  blogId: initialBlogId,
}: StepByStepBlogGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepKey>("headings");
  const [currentHeadingIndex, setCurrentHeadingIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [blogId, setBlogId] = useState<string | null>(initialBlogId || null);
  const [allHeadings, setAllHeadings] = useState<HeadingItem[]>([]);
  const [headingsForImages, setHeadingsForImages] = useState<HeadingItem[]>([]);
  const [generatedImages, setGeneratedImages] = useState<MediaItem[]>([]);
  const [showImageSelectionModal, setShowImageSelectionModal] = useState(false);

  // Add shimmer animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .animate-shimmer {
        animation: shimmer 2s infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [progress, setProgress] = useState<GenerationProgress>({
    currentStep: "headings",
    currentHeadingIndex: 0,
    headingsApproved: false,
    imagesApproved: false,
    imageApproved: [],
    contentApproved: [],
    summaryApproved: false,
    conclusionApproved: false,
    faqApproved: false,
    seoApproved: false,
  });

  // ========================================================================
  // API CALLS
  // ========================================================================

  const callStepAPI = useCallback(
    async (
      step: StepKey,
      action: "generate" | "approve" | "regenerate",
      additionalData?: any,
    ) => {
      try {
        setLoading(true);

        const payload: any = {
          mode: "step",
          step,
          action,
          prompt: topic, // Backend expects 'prompt' not 'topic'
          ...(blogId && { blogId }),
          ...additionalData,
        };

        const response = await fetch("/api/blog/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Generation failed");
        }

        const result = await response.json();

        // Save blog ID from first response
        if (result.blogId && !blogId) {
          setBlogId(result.blogId);
        }

        setGeneratedData(result.data);
        return result;
      } catch (error: any) {
        console.log("Step API Error:", error);
        toast.error(error.message || "Failed to generate content");
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [topic, blogId],
  );

  // ========================================================================
  // INITIALIZE FROM DATABASE DATA (FOR EDIT MODE)
  // ========================================================================

  // Initialize headingsForImages from parent data when available (edit mode)
  // This ensures that when editing an existing blog, we use the actual heading IDs from the database
  useEffect(() => {
    if (data?.headings && data.headings.length > 0) {
      // Check if we need to sync headings from database
      const headings = data.headings;
      const needsSync =
        headingsForImages.length === 0 ||
        !headingsForImages.some((h) =>
          headings.find((dh: any) => dh.id === h.id),
        );

      if (needsSync) {
        // Filter H2-H4 headings for images
        const imageHeadings = headings.filter((h: any) => h.level >= 2 && h.level <= 4);
        setHeadingsForImages(imageHeadings);
      }
    }
  }, [data, data?.headings, headingsForImages]);

  // Initialize allHeadings from parent data when available (edit mode)
  useEffect(() => {
    const headings = data?.headings;

    if (data?.headings && data.headings.length > 0) {
      const needsSync =
        allHeadings.length === 0 ||
        !allHeadings.some((h) => headings?.find((dh: any) => dh.id === h.id));

      if (needsSync) {
        setAllHeadings(data.headings);
      }
    }
  }, [data, data?.headings, allHeadings]);

  // Initialize generatedImages from parent data when available (edit mode)
  useEffect(() => {
    if (data?.mediaLibrary && data.mediaLibrary.length > 0) {
      const existingImages = data.mediaLibrary.filter(
        (m) => m.type === "image",
      );
      const needsSync =
        generatedImages.length === 0 ||
        !existingImages.some((ei) =>
          generatedImages.find((gi) => gi.id === ei.id),
        );

      if (needsSync) {
        setGeneratedImages(existingImages);
      }
    }
  }, [data, data?.mediaLibrary, generatedImages]);

  // Auto-detect which headings already have images and set currentImageIndex accordingly
  useEffect(() => {
    if (currentStep === "images" && headingsForImages.length > 0 && allHeadings.length > 0) {
      // Find first heading without an image
      let firstWithoutImage = -1;
      
      for (let i = 0; i < headingsForImages.length; i++) {
        const heading = headingsForImages[i];
        const headingInAll = allHeadings.find(h => h.id === heading.id);
        
        // Check if this heading has an image in its content
        const hasImage = headingInAll?.content?.includes('<img') || 
                        headingInAll?.content?.includes('<figure');
        
        // Also check if generateImage is false (user wants to skip)
        const wantsToSkip = heading.generateImage === false;
        
        if (!hasImage && !wantsToSkip) {
          firstWithoutImage = i;
          break;
        }
        
        // Mark as approved if it has image or is skipped
        if (hasImage || wantsToSkip) {
          const newProgress = { ...progress };
          if (!newProgress.imageApproved[i]) {
            newProgress.imageApproved[i] = true;
            setProgress(newProgress);
          }
        }
      }
      
      // Set index to first heading without image, or keep current if all have images
      if (firstWithoutImage !== -1 && currentImageIndex !== firstWithoutImage) {
        console.log(`📍 Auto-detected: Starting from heading index ${firstWithoutImage}`);
        setCurrentImageIndex(firstWithoutImage);
      }
    }
  }, [currentStep, headingsForImages, allHeadings, generatedImages]);

  // ========================================================================
  // STEP HANDLERS
  // ========================================================================

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic first!");
      return;
    }

    // Validate prerequisite steps
    const stepOrder: StepKey[] = [
      "headings",
      "content",
      "images",
      "summary",
      "conclusion",
      "faq",
      "seo",
    ];
    const currentStepIndex = stepOrder.indexOf(currentStep);

    // Check if previous steps are completed (using data from parent)
    if (currentStepIndex > 0) {
      const prevStep = stepOrder[currentStepIndex - 1];
      const prevStepCompleted = isStepCompleted(prevStep);

      // Also check parent data
      let parentDataCompleted = false;
      if (data) {
        switch (prevStep) {
          case "headings":
            parentDataCompleted = !!(data.headings && data.headings.length > 0);
            break;
          case "images":
            parentDataCompleted = !!(
              data.mediaLibrary && data.mediaLibrary.length > 0
            );
            break;
          case "content":
            parentDataCompleted = !!(
              data.headings &&
              data.headings.some(
                (h) => h.content && h.content.trim().length > 0,
              )
            );
            break;
          case "summary":
            parentDataCompleted = !!data.summary;
            break;
          case "conclusion":
            parentDataCompleted = !!data.conclusion;
            break;
          case "faq":
            parentDataCompleted = !!(data.faqs && data.faqs.length > 0);
            break;
          case "seo":
            parentDataCompleted = !!(
              data.seoTitle ||
              data.focusKeyword ||
              (data.tags && data.tags.length > 0)
            );
            break;
        }
      }

      if (!prevStepCompleted && !parentDataCompleted) {
        const stepTitle = STEPS.find((s) => s.key === prevStep)?.title;
        toast.error(`Please complete "${stepTitle}" step first!`);
        setCurrentStep(prevStep);
        return;
      }
    }

    // Check if headings step is completed for steps that require blogId
    const stepsRequiringBlogId: StepKey[] = [
      "images",
      "content",
      "summary",
      "conclusion",
      "faq",
      "seo",
    ];
    if (stepsRequiringBlogId.includes(currentStep)) {
      // Check if we have headings from parent data or local state
      const hasHeadings =
        (data?.headings && data.headings.length > 0) || allHeadings.length > 0;

      if (!blogId) {
        if (!hasHeadings) {
          toast.error('Please complete "Generate Structure" step first!');
          setCurrentStep("headings");
          return;
        }
        // We have headings but no blogId - this can happen when switching from full mode
        // We'll try to proceed, but content step requires heading index
        if (
          currentStep === "content" &&
          currentHeadingIndex === 0 &&
          allHeadings.length === 0 &&
          data?.headings
        ) {
          // Set heading index to 0 and use headings from parent
          setCurrentHeadingIndex(0);
        }
      }

      // Content step also requires heading index
      if (currentStep === "content") {
        const hasContentHeadings =
          (data?.headings && data.headings.length > 0) ||
          allHeadings.length > 0;
        if (!hasContentHeadings) {
          toast.error(
            'No headings found! Please complete "Generate Structure" step first.',
          );
          setCurrentStep("headings");
          return;
        }
        // Ensure we have a valid heading index
        if (
          currentHeadingIndex >= allHeadings.length &&
          allHeadings.length > 0
        ) {
          setCurrentHeadingIndex(0);
        }
      }
    }

    try {
      const additionalData: any = {};

      // Content step requires headingIndex
      if (currentStep === "content") {
        // Use headings from parent data if local state is empty
        if (allHeadings.length === 0 && data?.headings) {
          setAllHeadings(data.headings);
        }

        // Check if we've already generated all headings
        const headingsToUse =
          allHeadings.length > 0 ? allHeadings : data?.headings || [];
        if (
          headingsToUse.length > 0 &&
          currentHeadingIndex >= headingsToUse.length
        ) {
          console.log(
            `⚠️ All headings (${headingsToUse.length}) already have content generated`,
          );
          toast.error(`All content generated! Moving to summary step...`);
          // Move to summary step
          const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
          if (currentIndex < STEPS.length - 1) {
            const nextStep = STEPS[currentIndex + 1].key;
            setCurrentStep(nextStep);
            setGeneratedData(null);
          }
          return;
        }
        additionalData.headingIndex = currentHeadingIndex;
        console.log(
          `🎯 Generating content for heading index ${currentHeadingIndex} of ${headingsToUse.length}`,
        );
      }

      const result = await callStepAPI(currentStep, "generate", additionalData);

      // Show which heading we just generated
      if (currentStep === "content" && result.data?.heading) {
        toast.success(`Content generated for: ${result.data.heading.text}`);
      } else {
        toast.success(
          `${STEPS.find((s) => s.key === currentStep)?.title} generated!`,
        );
      }
    } catch (error: any) {
      // Better error handling
      console.log("Generation error:", error);
      if (error.message?.includes("Blog ID")) {
        toast.error(
          'Please complete "Generate Structure" step first to get a Blog ID.',
        );
        setCurrentStep("headings");
      } else if (error.message?.includes("heading index")) {
        toast.error("Invalid heading index. Please try again.");
      } else {
        toast.error(error.message || "Generation failed. Please try again.");
      }
    }
  };

  const handleRegenerate = async () => {
    try {
      const additionalData: any = {};

      // Content step requires headingIndex
      if (currentStep === "content") {
        additionalData.headingIndex = currentHeadingIndex;
      }

      const result = await callStepAPI(
        currentStep,
        "regenerate",
        additionalData,
      );

      if (currentStep === "content" && result.data?.heading) {
        toast.success(`Content regenerated for: ${result.data.heading.text}`);
      } else {
        toast.success("Content regenerated!");
      }
    } catch (error) {
      // Error handled in callStepAPI
    }
  };

  // Handle step click to switch between steps
  const handleStepClick = (stepKey: StepKey) => {
    setCurrentStep(stepKey);
    setGeneratedData(null);

    // Reset content index when switching to content step
    if (stepKey === "content") {
      setCurrentHeadingIndex(0);
    }

    // Reset image index when switching to images step
    if (stepKey === "images") {
      setCurrentImageIndex(0);
    }
  };

  // ========================================================================
  // IMAGE GENERATION HANDLERS
  // ========================================================================

  const handleImageGenerate = async () => {
    if (!blogId) {
      toast.error("Blog ID not found. Please approve headings first.");
      return;
    }

    // Always use headingsForImages which contains the filtered H2-H4 headings
    const headingForImage = headingsForImages[currentImageIndex];

    if (!headingForImage) {
      toast.error("No heading available for image generation");
      return;
    }

    // Check if user wants to skip this heading
    if (headingForImage.generateImage === false) {
      console.log(`⏭️ Skipping image for: ${headingForImage.text}`);
      toast.success(`Skipped image for: ${headingForImage.text}`);
      
      // Mark as approved (skipped) and move to next
      const newProgress = { ...progress };
      if (!newProgress.imageApproved[currentImageIndex]) {
        newProgress.imageApproved[currentImageIndex] = true;
      }
      setProgress(newProgress);
      
      // Move to next image
      handleImageApprove();
      return;
    }

    console.log(
      `🎨 [ImageGen] Using heading ID: ${headingForImage.id}, text: ${headingForImage.text}`,
    );

    try {
      setLoading(true);

      console.log(
        `🎨 [StepGenerator] Generating image for heading: ${headingForImage.text}`,
      );

      // Show toast with heading name
      toast.loading(`Generating image for: ${headingForImage.text}`, {
        id: 'image-generation',
      });

      const response = await fetch("/api/blog/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blogId,
          headingId: headingForImage.id,
          insertIntoContent: true,
        }),
      });

      const rawText = await response.text();

      let result: any = null;

      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch {
        console.error("❌ Invalid JSON response from image API:", {
          status: response.status,
          statusText: response.statusText,
          rawText,
        });

        throw new Error(
          `Image API returned invalid response. Status: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.ok) {
        console.error("❌ Image API error:", {
          status: response.status,
          statusText: response.statusText,
          result,
          rawText,
        });

        if (response.status === 504) {
          throw new Error(
            "Image generation timed out on the server. The image model is taking too long in production.",
          );
        }

        throw new Error(
          result?.error ||
            result?.message ||
            `Image generation failed. Status: ${response.status}`,
        );
      }

      if (!result?.mediaItem?.url) {
        console.error(
          "❌ Image API returned success but mediaItem is missing:",
          result,
        );

        throw new Error(
          "Image generated, but media data was missing from response.",
        );
      }

      console.log(`✅ [StepGenerator] Image generated:`, result);

      // Dismiss loading toast and show success
      toast.dismiss('image-generation');
      toast.success(`Image generated for: ${headingForImage.text}`);

      const newImage: MediaItem = {
        id: result.mediaItem.id,
        type: "image",
        url: result.mediaItem.url,
        s3Key: result.mediaItem.s3Key,
        alt: result.mediaItem.alt,
        caption: result.mediaItem.caption,
      };

      setGeneratedImages((prev) => [...prev, newImage]);

      const updatedHeadings = [...allHeadings];
      const headingIndex = updatedHeadings.findIndex(
        (h) => h.id === headingForImage.id,
      );

      if (headingIndex !== -1) {
        const imageHtml = `<figure class="my-6">\n  <img src="${result.mediaItem.url}" alt="${result.mediaItem.alt}" class="w-full rounded-xl shadow-lg" />\n</figure>`;

        updatedHeadings[headingIndex] = {
          ...updatedHeadings[headingIndex],
          content: imageHtml + (updatedHeadings[headingIndex].content || ""),
        };

        setAllHeadings(updatedHeadings);
      }

      onDataUpdate({
        headings: updatedHeadings,
        mediaLibrary: [...generatedImages, newImage],
      });

      const newProgress = { ...progress };

      if (!newProgress.imageApproved[currentImageIndex]) {
        newProgress.imageApproved[currentImageIndex] = true;
      }

      setProgress(newProgress);

      setGeneratedData({
        image: newImage,
        heading: headingForImage,
        headingIndex: currentImageIndex,
        totalHeadings: headingsForImages.length,
      });

      // Remove the duplicate success toast since we already showed it above
    } catch (error: any) {
      console.error("Image generation error:", error);

      toast.dismiss('image-generation');
      toast.error(error?.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const handleImageApprove = async () => {
    const isLastImage = currentImageIndex >= headingsForImages.length - 1;

    if (isLastImage) {
      // All images done, move to summary step
      const currentIndex = STEPS.findIndex((s) => s.key === "images");
      const nextStep = STEPS[currentIndex + 1].key;
      setCurrentStep(nextStep);

      const newProgress = { ...progress };
      newProgress.imagesApproved = true;
      newProgress.currentStep = nextStep;
      setProgress(newProgress);

      setCurrentImageIndex(0);
      setGeneratedData(null);

      toast.success("All images generated! Moving to summary step...");
    } else {
      // Move to next image
      const nextIndex = currentImageIndex + 1;
      setCurrentImageIndex(nextIndex);
      setGeneratedData(null);

      const newProgress = { ...progress };
      newProgress.currentHeadingIndex = nextIndex;
      setProgress(newProgress);

      toast.success(
        `Image ${currentImageIndex + 1} approved. Ready for image ${nextIndex + 1}`,
      );
    }
  };

  const handleApprove = async () => {
    try {
      const additionalData: any = {};

      // Content step requires headingIndex
      if (currentStep === "content") {
        additionalData.headingIndex = currentHeadingIndex;
      }

      console.log("🚀 [StepGenerator] Approve clicked:", {
        currentStep,
        currentHeadingIndex,
        blogId,
        additionalData,
      });

      const result = await callStepAPI(currentStep, "approve", additionalData);

      console.log("📥 [StepGenerator] API Response:", {
        step: currentStep,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        isLastHeading: result.isLastHeading,
      });

      // Update parent component with new data
      if (result.data) {
        const updateData: Partial<StepGeneratorData> = {};

        if (currentStep === "headings" && result.data.headings) {
          console.log("📋 [StepGenerator] Processing headings approval:", {
            headingsCount: result.data.headings.length,
            headings: result.data.headings.map((h: any) => ({
              id: h.id,
              text: h.text,
              level: h.level,
              hasContent: !!h.content,
            })),
          });

          updateData.headings = result.data.headings;
          updateData.seoTitle =
            result.data.seoTitle || result.data.suggestedTitle;
          updateData.focusKeyword = result.data.focusKeyword;

          // Store headings for content step
          setAllHeadings(result.data.headings);
          setGeneratedData({
            ...result.data,
            headings: result.data.headings,
          });
        } else if (currentStep === "content" && result.data.heading) {
          console.log("✍️ [StepGenerator] Processing content approval:", {
            headingIndex: currentHeadingIndex,
            headingId: result.data.heading.id,
            headingText: result.data.heading.text,
            contentLength: result.data.heading.content?.length || 0,
            allHeadingsCount: allHeadings.length,
          });

          // Update the specific heading in allHeadings array
          const updatedHeadings = [...allHeadings];
          updatedHeadings[currentHeadingIndex] = result.data.heading;

          console.log("📊 [StepGenerator] Updated headings array:", {
            totalHeadings: updatedHeadings.length,
            headings: updatedHeadings.map((h, i) => ({
              index: i,
              id: h.id,
              text: h.text,
              contentLength: h.content?.length || 0,
            })),
          });

          setAllHeadings(updatedHeadings);
          // Send updated headings to parent immediately
          updateData.headings = updatedHeadings;
        } else if (currentStep === "summary" && result.data.summary) {
          updateData.summary = result.data.summary;
        } else if (currentStep === "conclusion" && result.data.conclusion) {
          updateData.conclusion = result.data.conclusion;
        } else if (currentStep === "faq" && result.data.faqs) {
          updateData.faqs = result.data.faqs;
        } else if (currentStep === "seo") {
          // SEO approve returns blog object, not data object
          const seoBlogData = result.blog?.seo || result.data;
          updateData.seoDescription = seoBlogData.seoDescription;
          updateData.tags = seoBlogData.tags;
          updateData.author = seoBlogData.author;
          updateData.anchors = seoBlogData.anchors;
          updateData.seoTitle = seoBlogData.seoTitle;
          updateData.focusKeyword = seoBlogData.focusKeyword;
        }

        console.log("📤 [StepGenerator] Calling onDataUpdate with:", {
          updateDataKeys: Object.keys(updateData),
          headingsCount: updateData.headings?.length,
          headingsData: updateData.headings?.map((h) => ({
            id: h.id,
            text: h.text,
            contentLength: h.content?.length || 0,
          })),
        });

        onDataUpdate(updateData);

        console.log("✅ [StepGenerator] onDataUpdate called successfully");
      }

      // Update progress
      const newProgress = { ...progress };

      // Special handling for content step - iterate through headings
      if (currentStep === "content") {
        // Mark current heading as approved
        if (!newProgress.contentApproved[currentHeadingIndex]) {
          newProgress.contentApproved[currentHeadingIndex] = true;
        }

        // Check if this was the last heading OR if we've gone through all headings
        const isLastHeading =
          result.isLastHeading || currentHeadingIndex >= allHeadings.length - 1;

        if (isLastHeading) {
          // All headings done, prepare headings for images and show selection modal
          console.log(
            `✅ All ${allHeadings.length} headings completed. Showing image selection modal...`,
          );

          // Prepare headings for images (H2-H4)
          const headingsWithImages =
            allHeadings.filter((h) => h.level >= 2 && h.level <= 4) || [];
          setHeadingsForImages(headingsWithImages);
          
          // Show modal for user to select which headings should have images
          setShowImageSelectionModal(true);
          toast.success("All content generated! Select headings for images...");
        } else {
          // Move to next heading
          const nextIndex = currentHeadingIndex + 1;
          console.log(
            `➡️ Moving from heading ${currentHeadingIndex} to ${nextIndex}`,
          );
          setCurrentHeadingIndex(nextIndex);
          newProgress.currentHeadingIndex = nextIndex;
          setGeneratedData(null); // Clear so user needs to generate next heading
          toast.success(
            `Heading ${currentHeadingIndex + 1} approved. Ready for heading ${nextIndex + 1}`,
          );
        }
      } else {
        // Other steps - standard flow
        if (currentStep === "headings") {
          newProgress.headingsApproved = true;
        } else if (currentStep === "images") newProgress.imagesApproved = true;
        else if (currentStep === "summary") newProgress.summaryApproved = true;
        else if (currentStep === "conclusion")
          newProgress.conclusionApproved = true;
        else if (currentStep === "faq") newProgress.faqApproved = true;
        else if (currentStep === "seo") newProgress.seoApproved = true;

        // Move to next step
        const currentIndex = STEPS.findIndex((s) => s.key === currentStep);
        if (currentIndex < STEPS.length - 1) {
          const nextStep = STEPS[currentIndex + 1].key;
          setCurrentStep(nextStep);
          newProgress.currentStep = nextStep;

          // For other transitions, clear generated data
          setGeneratedData(null);
          toast.success("Moving to next step...");
        } else {
          // All steps complete
          newProgress.currentStep = "completed";
          onComplete();
          toast.success("🎉 Blog generation completed!");
        }
      }

      setProgress(newProgress);
    } catch (error) {
      // Error handled in callStepAPI
    }
  };

  // Handle image selection confirmation
  const handleImageSelectionConfirm = () => {
    setShowImageSelectionModal(false);
    
    // Update allHeadings with generateImage flags
    const updatedAllHeadings = allHeadings.map(h => {
      const imageHeading = headingsForImages.find(ih => ih.id === h.id);
      if (imageHeading) {
        return { ...h, generateImage: imageHeading.generateImage };
      }
      return h;
    });
    setAllHeadings(updatedAllHeadings);
    onDataUpdate({ headings: updatedAllHeadings });
    
    const newProgress = { ...progress };
    newProgress.imageApproved = new Array(headingsForImages.length).fill(false);
    
    // Move to images step
    const nextStep = "images";
    setCurrentStep(nextStep);
    newProgress.currentStep = nextStep;
    setCurrentHeadingIndex(0);
    setCurrentImageIndex(0);
    setGeneratedData(null);
    setProgress(newProgress);
    
    toast.success("Ready to generate images!");
  };

  // Toggle image generation for a heading
  const toggleHeadingImageGeneration = (headingId: string) => {
    const updated = headingsForImages.map(h => 
      h.id === headingId ? { ...h, generateImage: h.generateImage !== false ? false : true } : h
    );
    setHeadingsForImages(updated);
  };

  // ========================================================================
  // STEP COMPLETION CHECK
  // ========================================================================

  const isStepCompleted = (stepKey: StepKey): boolean => {
    // First check progress state
    let isCompleted = false;
    switch (stepKey) {
      case "headings":
        isCompleted = progress.headingsApproved;
        break;
      case "images":
        isCompleted = progress.imagesApproved;
        break;
      case "summary":
        isCompleted = progress.summaryApproved;
        break;
      case "conclusion":
        isCompleted = progress.conclusionApproved;
        break;
      case "faq":
        isCompleted = progress.faqApproved;
        break;
      case "seo":
        isCompleted = progress.seoApproved;
        break;
      case "content":
        isCompleted = progress.contentApproved.length > 0;
        break;
      default:
        isCompleted = false;
    }

    // Also check if parent data exists (for persistence across remounts)
    if (!isCompleted && data) {
      switch (stepKey) {
        case "headings":
          isCompleted = !!(data.headings && data.headings.length > 0);
          break;
        case "images":
          isCompleted = !!(data.mediaLibrary && data.mediaLibrary.length > 0);
          break;
        case "summary":
          isCompleted = !!data.summary;
          break;
        case "conclusion":
          isCompleted = !!data.conclusion;
          break;
        case "faq":
          isCompleted = !!(data.faqs && data.faqs.length > 0);
          break;
        case "seo":
          isCompleted = !!(
            data.seoTitle ||
            data.focusKeyword ||
            (data.tags && data.tags.length > 0)
          );
          break;
        case "content":
          isCompleted = !!(
            data.headings &&
            data.headings.some((h) => h.content && h.content.trim().length > 0)
          );
          break;
      }
    }

    return isCompleted;
  };

  // ========================================================================
  // RENDER STEP CONTENT
  // ========================================================================

  const renderStepContent = () => {
    // Content step has special handling below
    if (!generatedData && currentStep !== "content") {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
            <FiZap size={24} className="text-slate-600" />
          </div>
          <p className="text-slate-400 mb-4 text-sm">
            Click Generate to create{" "}
            {STEPS.find((s) => s.key === currentStep)?.title.toLowerCase()}
          </p>
        </div>
      );
    }

    switch (currentStep) {
      case "headings":
        return (
          <div className="space-y-3">
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <p className="text-sm text-slate-300 mb-2">
                <strong>Title:</strong> {generatedData.seoTitle}
              </p>
              <p className="text-sm text-slate-300 mb-3">
                <strong>Focus Keyword:</strong> {generatedData.focusKeyword}
              </p>
              <div className="text-sm text-slate-300">
                <strong>
                  Headings ({generatedData.headings?.length || 0}):
                </strong>
                <ul className="mt-2 space-y-1.5 ml-4">
                  {generatedData.headings?.map((h: HeadingItem, i: number) => (
                    <li
                      key={h.id}
                      className={`${h.level === 2 ? "font-semibold" : "ml-4 text-slate-400"}`}
                    >
                      {h.level === 2 ? "•" : "◦"} {h.text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );

      case "images":
        // Show individual image generation for each heading
        const totalImages = headingsForImages.length;
        const currentImageNum = currentImageIndex + 1;
        const currentImageHeading = headingsForImages[currentImageIndex];

        if (totalImages === 0 || !currentImageHeading) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <FiImage size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 mb-4">
                No headings available for image generation
              </p>
            </div>
          );
        }

        // Check if user wants to skip this heading
        const shouldGenerateImage = currentImageHeading.generateImage !== false;

        return (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Progress:</span>
                <span className="text-[#fe9a00] font-semibold">
                  Image {currentImageNum} of {totalImages}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-[#fe9a00] h-2 rounded-full transition-all"
                  style={{
                    width: `${(currentImageIndex / totalImages) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {progress.imageApproved.filter(Boolean).length} completed • 
                {headingsForImages.filter(h => {
                  const headingInAll = allHeadings.find(ah => ah.id === h.id);
                  return headingInAll?.content?.includes('<img') || headingInAll?.content?.includes('<figure');
                }).length} already have images
              </div>
            </div>

            {/* Current heading info - ALWAYS SHOW */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">
                    Generating image for:
                  </p>
                  <h4 className="text-base font-semibold text-[#fe9a00]">
                    {currentImageHeading.text}
                  </h4>
                </div>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                  H{currentImageHeading.level}
                </span>
              </div>
            </div>

            {/* Image generation toggle */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-300">Generate image for this heading</span>
                <input
                  type="checkbox"
                  checked={shouldGenerateImage}
                  onChange={(e) => {
                    const updated = [...headingsForImages];
                    updated[currentImageIndex] = {
                      ...updated[currentImageIndex],
                      generateImage: e.target.checked
                    };
                    setHeadingsForImages(updated);
                    onDataUpdate({ headings: updated });
                  }}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-[#fe9a00] focus:ring-[#fe9a00]"
                />
              </label>
            </div>

            {/* Generated image */}
            {loading && !generatedData?.image ? (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-[#fe9a00]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-[#fe9a00] flex items-center gap-1">
                    <FiLoader size={14} className="animate-spin" />
                    Generating Image...
                  </span>
                  <span className="text-xs text-slate-500">Please wait</span>
                </div>
                <div className="relative w-full aspect-video bg-linear-to-br from-slate-700/50 via-slate-800/50 to-slate-900/50 rounded-lg overflow-hidden backdrop-blur-sm">
                  {/* Multiple animated layers for depth */}
                  <div className="absolute inset-0">
                    {/* Base gradient animation */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-[#fe9a00]/5 to-transparent animate-pulse"></div>
                    
                    {/* Shimmer effect 1 */}
                    <div 
                      className="absolute inset-0 bg-linear-to-r from-transparent via-slate-600/30 to-transparent"
                      style={{
                        animation: 'shimmer 3s infinite',
                        animationDelay: '0s'
                      }}
                    ></div>
                    
                    {/* Shimmer effect 2 */}
                    <div 
                      className="absolute inset-0 bg-linear-to-r from-transparent via-[#fe9a00]/10 to-transparent"
                      style={{
                        animation: 'shimmer 3s infinite',
                        animationDelay: '1s'
                      }}
                    ></div>
                    
                    {/* Blur overlay */}
                    <div className="absolute inset-0 backdrop-blur-[2px]"></div>
                  </div>
                  
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-center px-4">
                      <div className="relative inline-block mb-3">
                        <FiImage size={56} className="text-slate-600/50 animate-pulse" />
                        <div className="absolute inset-0 bg-[#fe9a00]/20 blur-xl animate-pulse"></div>
                      </div>
                      <p className="text-sm text-slate-400 font-medium mb-1">Creating AI Image</p>
                      <p className="text-xs text-slate-500 max-w-xs line-clamp-2">{currentImageHeading.text}</p>
                      
                      {/* Loading dots */}
                      <div className="flex items-center justify-center gap-1 mt-3">
                        <div className="w-1.5 h-1.5 bg-[#fe9a00] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#fe9a00] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-1.5 bg-[#fe9a00] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Corner decorations */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-slate-600/30 rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-slate-600/30 rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-slate-600/30 rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-slate-600/30 rounded-br-lg"></div>
                </div>
              </div>
            ) : generatedData?.image ? (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <FiCheckCircle size={14} />
                    Image Generated
                  </span>
                </div>
                <div className="relative">
                  <img
                    src={generatedData.image.url}
                    alt={generatedData.image.alt}
                    className="w-full rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-dashed border-slate-700 text-center">
                <FiImage size={20} className="mx-auto mb-2 text-slate-600" />
                <p className="text-slate-400 text-sm">
                  Click <strong className="text-[#fe9a00]">Generate</strong>{" "}
                  below to create an image
                </p>
              </div>
            )}
          </div>
        );

      case "content":
        // Show individual heading generation
        const totalHeadings =
          allHeadings.length || progress.contentApproved.length;
        const currentHeadingNum = currentHeadingIndex + 1;
        const currentHeading = allHeadings[currentHeadingIndex];

        if (totalHeadings === 0 || !currentHeading) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800/50 flex items-center justify-center">
                <FiZap size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 mb-4">
                Please approve headings first
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {/* Progress indicator */}
            <div className="bg-slate-800/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Progress:</span>
                <span className="text-[#fe9a00] font-semibold">
                  Heading {currentHeadingNum} of {totalHeadings}
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-[#fe9a00] h-2 rounded-full transition-all"
                  style={{
                    width: `${(currentHeadingIndex / totalHeadings) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {progress.contentApproved.filter(Boolean).length} completed
              </div>
            </div>

            {/* Current heading info - ALWAYS SHOW */}
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Generating for:</p>
                  <h4 className="text-xs font-semibold text-[#fe9a00]">
                    {currentHeading.text}
                  </h4>
                </div>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">
                  H{currentHeading.level}
                </span>
              </div>
            </div>

            {/* Generated content */}
            {generatedData?.heading?.content ? (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-green-500/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-green-500 flex items-center gap-1">
                    <FiCheckCircle size={10} />
                    Content Generated
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {generatedData.heading.content?.length || 0} characters
                  </span>
                </div>
                <div
                  className="text-slate-300 prose prose-sm text-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: generatedData.heading.content,
                  }}
                />
              </div>
            ) : (
              <div className="bg-slate-800/50 p-4 rounded-lg border border-dashed border-slate-700 text-center">
                <FiEdit3 size={20} className="mx-auto mb-2 text-slate-600" />
                <p className="text-slate-400 text-sm">
                  Click <strong className="text-[#fe9a00]">Generate</strong>{" "}
                  below to create content
                </p>
              </div>
            )}
          </div>
        );

      case "summary":
        return (
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div
              className="text-sm text-slate-300 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedData.summary }}
            />
          </div>
        );

      case "conclusion":
        return (
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <div
              className="text-sm text-slate-300 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: generatedData.conclusion }}
            />
          </div>
        );

      case "faq":
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-400 mb-3">
              {generatedData.faqs?.length || 0} FAQ items generated
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {generatedData.faqs?.map((faq: FAQItem) => (
                <div key={faq.id} className="bg-slate-800/50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-slate-300 mb-1">
                    Q: {faq.question}
                  </p>
                  <p className="text-xs text-slate-400">A: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "seo":
        return (
          <div className="space-y-3">
            <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Meta Description</p>
                <p className="text-sm text-slate-300">
                  {generatedData.seoDescription}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {generatedData.seoDescription?.length || 0}/160 characters
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {generatedData.tags?.map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="bg-[#fe9a00]/20 text-[#fe9a00] px-2 py-0.5 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Auto-Links ({generatedData.anchors?.length || 0})
                </p>
                <div className="space-y-1">
                  {generatedData.anchors?.slice(0, 3).map((anchor: Anchor) => (
                    <p key={anchor.id} className="text-xs text-slate-400">
                      • {anchor.keyword}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  if (progress.currentStep === "completed") {
    return (
      <div className="bg-linear-to-br from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-xl p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <FiCheck size={32} className="text-green-500" />
        </div>
        <h3 className="text-lg font-bold text-green-400 mb-2">
          🎉 Generation Complete!
        </h3>
        <p className="text-sm text-slate-300">
          All sections have been generated and approved
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/30 border border-slate-700 rounded-xl overflow-hidden">
      {/* Image Selection Modal */}
      {showImageSelectionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Select Headings for Image Generation</h3>
              <p className="text-sm text-slate-400 mt-1">Choose which headings should have AI-generated images</p>
              
              {/* Summary stats */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-slate-700/50 p-2 rounded-lg text-center">
                  <div className="text-xs text-slate-400">Total</div>
                  <div className="text-lg font-bold text-white">{headingsForImages.length}</div>
                </div>
                <div className="bg-green-500/10 p-2 rounded-lg text-center border border-green-500/30">
                  <div className="text-xs text-green-400">Has Image</div>
                  <div className="text-lg font-bold text-green-400">
                    {headingsForImages.filter(h => {
                      const headingInAll = allHeadings.find(ah => ah.id === h.id);
                      return headingInAll?.content?.includes('<img') || headingInAll?.content?.includes('<figure');
                    }).length}
                  </div>
                </div>
                <div className="bg-slate-700/50 p-2 rounded-lg text-center">
                  <div className="text-xs text-slate-400">No Image</div>
                  <div className="text-lg font-bold text-slate-300">
                    {headingsForImages.filter(h => {
                      const headingInAll = allHeadings.find(ah => ah.id === h.id);
                      const hasImage = headingInAll?.content?.includes('<img') || headingInAll?.content?.includes('<figure');
                      return !hasImage;
                    }).length}
                  </div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="mt-3 bg-slate-700/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Selected for generation:</span>
                  <span className="text-sm font-semibold text-[#fe9a00]">
                    {headingsForImages.filter(h => h.generateImage !== false).length} of {headingsForImages.length}
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <div
                    className="bg-[#fe9a00] h-2 rounded-full transition-all"
                    style={{
                      width: `${(headingsForImages.filter(h => h.generateImage !== false).length / headingsForImages.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                {headingsForImages.map((heading) => {
                  // Check if this heading already has an image
                  const existingImage = generatedImages.find(img => {
                    const headingInAll = allHeadings.find(h => h.id === heading.id);
                    return headingInAll?.content?.includes(img.url);
                  });
                  
                  return (
                    <div
                      key={heading.id}
                      className="bg-slate-700/50 p-3 rounded-lg border border-slate-600 hover:border-[#fe9a00]/50 transition-all"
                    >
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={heading.generateImage !== false}
                          onChange={() => toggleHeadingImageGeneration(heading.id)}
                          className="w-5 h-5 rounded bg-slate-600 border-slate-500 text-[#fe9a00] focus:ring-[#fe9a00]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 bg-slate-600 px-2 py-0.5 rounded">H{heading.level}</span>
                            <span className="text-sm text-white font-medium">{heading.text}</span>
                            {existingImage && (
                              <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                <FiCheckCircle size={10} />
                                Has Image
                              </span>
                            )}
                          </div>
                        </div>
                        {existingImage && (
                          <div className="w-12 h-12 rounded overflow-hidden border border-slate-600">
                            <img
                              src={existingImage.url}
                              alt={existingImage.alt}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-700 flex gap-2">
              <button
                onClick={() => {
                  const allSelected = headingsForImages.map(h => ({ ...h, generateImage: true }));
                  setHeadingsForImages(allSelected);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Select All
              </button>
              <button
                onClick={() => {
                  const allDeselected = headingsForImages.map(h => ({ ...h, generateImage: false }));
                  setHeadingsForImages(allDeselected);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Deselect All
              </button>
              <div className="flex-1"></div>
              <button
                onClick={handleImageSelectionConfirm}
                className="px-6 py-2 bg-[#fe9a00] hover:bg-[#ff8800] text-white rounded-lg text-sm font-semibold transition-all"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-slate-900/50 border-b border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">AI Step-by-Step</h3>
          <span className="text-xs text-slate-400">
            Step {STEPS.findIndex((s) => s.key === currentStep) + 1}/
            {STEPS.length}
          </span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((step, index) => (
            <div
              key={step.key}
              onClick={() => handleStepClick(step.key)}
              className={`flex-1 h-1.5 rounded-full transition-all cursor-pointer ${
                isStepCompleted(step.key)
                  ? "bg-green-500"
                  : step.key === currentStep
                    ? "bg-[#fe9a00]"
                    : "bg-slate-700"
              }`}
              title={step.title}
              suppressHydrationWarning
            />
          ))}
        </div>
      </div>

      {/* Step List */}
      <div className="p-3 border-b border-slate-700 max-h-48 overflow-y-auto">
        <div className="space-y-1">
          {STEPS.map((step) => (
            <div
              key={step.key}
              onClick={() => handleStepClick(step.key)}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer ${
                isStepCompleted(step.key)
                  ? "bg-green-900/20 border border-green-500/30"
                  : step.key === currentStep
                    ? "bg-[#fe9a00]/10 border border-[#fe9a00]/30"
                    : "bg-transparent"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isStepCompleted(step.key)
                    ? "bg-green-500 text-white"
                    : step.key === currentStep
                      ? "bg-[#fe9a00] text-white"
                      : "bg-slate-700 text-slate-400"
                }`}
              >
                {isStepCompleted(step.key) ? (
                  <FiCheck size={12} />
                ) : (
                  <span className="text-xs">
                    {STEPS.findIndex((s) => s.key === step.key) + 1}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-xs font-semibold ${
                    isStepCompleted(step.key)
                      ? "text-green-400"
                      : step.key === currentStep
                        ? "text-white"
                        : "text-slate-400"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[10px] text-slate-500">{step.description}</p>
              </div>
              {step.key === currentStep && (
                <FiChevronRight size={14} className="text-[#fe9a00]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="p-4">
        {/* Image Status Summary - Always visible in images step */}
        {currentStep === "images" && headingsForImages.length > 0 && (
          <div className="mb-4 bg-slate-900/50 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-300">Image Status</h4>
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              <div className="bg-slate-800/50 p-2 rounded text-center">
                <div className="text-[10px] text-slate-400">Total</div>
                <div className="text-sm font-bold text-white">{headingsForImages.length}</div>
              </div>
              <div className="bg-green-500/10 p-2 rounded text-center border border-green-500/30">
                <div className="text-[10px] text-green-400">Has Image</div>
                <div className="text-sm font-bold text-green-400">
                  {headingsForImages.filter(h => {
                    const headingInAll = allHeadings.find(ah => ah.id === h.id);
                    return headingInAll?.content?.includes('<img') || headingInAll?.content?.includes('<figure');
                  }).length}
                </div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded text-center">
                <div className="text-[10px] text-slate-400">No Image</div>
                <div className="text-sm font-bold text-slate-300">
                  {headingsForImages.filter(h => {
                    const headingInAll = allHeadings.find(ah => ah.id === h.id);
                    const hasImage = headingInAll?.content?.includes('<img') || headingInAll?.content?.includes('<figure');
                    return !hasImage;
                  }).length}
                </div>
              </div>
            </div>
            
            {/* List of headings with status */}
            <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
              {headingsForImages.map((h, idx) => {
                const headingInAll = allHeadings.find(ah => ah.id === h.id);
                const hasImage = headingInAll?.content?.includes('<img') || headingInAll?.content?.includes('<figure');
                const isSkipped = h.generateImage === false;
                const isCurrentHeading = idx === currentImageIndex;
                
                return (
                  <div 
                    key={h.id} 
                    className={`flex items-center gap-2 text-xs p-1.5 rounded transition-all ${
                      isCurrentHeading 
                        ? 'bg-[#fe9a00]/20 border border-[#fe9a00]/50' 
                        : 'bg-slate-800/30 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                    <span className="flex-1 text-slate-300 truncate">{h.text}</span>
                    
                    {/* Status badge */}
                    {hasImage ? (
                      <span className="text-[10px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FiCheckCircle size={8} />
                        Has
                      </span>
                    ) : isSkipped ? (
                      <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">
                        Skipped
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">
                        Pending
                      </span>
                    )}
                    
                    {/* Toggle checkbox - only show if no image yet */}
                    {!hasImage && (
                      <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!isSkipped}
                          onChange={() => {
                            const updated = [...headingsForImages];
                            updated[idx] = {
                              ...updated[idx],
                              generateImage: updated[idx].generateImage === false ? true : false
                            };
                            setHeadingsForImages(updated);
                            
                            // Also update allHeadings
                            const updatedAll = allHeadings.map(ah => 
                              ah.id === h.id ? { ...ah, generateImage: updated[idx].generateImage } : ah
                            );
                            setAllHeadings(updatedAll);
                            onDataUpdate({ headings: updatedAll });
                          }}
                          className="w-3 h-3 rounded bg-slate-700 border-slate-600 text-[#fe9a00] focus:ring-[#fe9a00] focus:ring-1"
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-[#fe9a00]">
              {STEPS.find((s) => s.key === currentStep)?.icon}
            </div>
            <h4 className="text-sm font-bold text-white">
              {STEPS.find((s) => s.key === currentStep)?.title}
            </h4>
          </div>
          <p className="text-xs text-slate-400">
            {STEPS.find((s) => s.key === currentStep)?.description}
          </p>
        </div>

        {renderStepContent()}

        {/* Action Buttons */}
        <div className="flex flex-col gap-1 mt-4">
          {/* Images step has special handling */}
          {currentStep === "images" ? (
            !generatedData ? (
              <button
                onClick={handleImageGenerate}
                disabled={loading || !blogId}
                className="flex-1 bg-[#fe9a00] hover:bg-[#ff8800] disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <FiLoader size={14} className="animate-spin" />
                    Generating...
                  </>
                ) : headingsForImages[currentImageIndex]?.generateImage === false ? (
                  <>
                    <FiChevronRight size={14} />
                    Skip Image
                  </>
                ) : (
                  <>
                    <FiImage size={14} />
                    Generate Image
                  </>
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={handleImageGenerate}
                  disabled={loading}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <FiLoader size={14} className="animate-spin" />
                  ) : (
                    <>
                      <FiRefreshCw size={14} />
                      Regenerate
                    </>
                  )}
                </button>
                <button
                  onClick={handleImageApprove}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-nowrap disabled:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <FiLoader size={14} className="animate-spin" />
                  ) : (
                    <>
                      <FiCheck size={14} />
                      {currentImageIndex >= headingsForImages.length - 1
                        ? "Approve All"
                        : "Approve & Next"}
                    </>
                  )}
                </button>
              </>
            )
          ) : /* Other steps use standard handlers */
          !generatedData ? (
            <button
              onClick={handleGenerate}
              disabled={loading || !topic.trim()}
              className="flex-1 bg-[#fe9a00] hover:bg-[#ff8800] disabled:bg-slate-700 disabled:text-slate-500 text-white py-2.5 px-4 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <FiLoader size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiZap size={14} />
                  Generate
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <FiLoader size={14} className="animate-spin" />
                ) : (
                  <>
                    <FiRefreshCw size={14} />
                    Regenerate
                  </>
                )}
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-500 text-nowrap disabled:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <FiLoader size={14} className="animate-spin" />
                ) : (
                  <>
                    <FiCheck size={14} />
                    Approve & Next
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import   { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import ImageExtension from "@tiptap/extension-image";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Blockquote from "@tiptap/extension-blockquote";
import CodeBlock from "@tiptap/extension-code-block";
import Mention from "@tiptap/extension-mention";
import StepByStepBlogGenerator from "./StepByStepBlogGenerator";
import {
  FiCpu,
  FiGlobe,
  FiImage,
  FiLink,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiSave,
  FiTrash2,
  FiBold,
  FiItalic,
  FiX,
  FiType,
  FiUnderline,
  FiHash,
  FiMonitor,
  FiTablet,
  FiSmartphone,
  FiCheckCircle,
  FiEdit3,
  FiMessageSquare,
  FiVideo,
  FiMinus,
  FiCode,
  FiCheckSquare,
  FiArrowLeft,
  FiArchive,
} from "react-icons/fi";
import { showToast } from "@/lib/toast";

// ============================================================================
// TYPES
// ============================================================================

interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  s3Key?: string;
  alt: string;
  caption?: string;
  filename?: string;
  size?: number;
}

interface Anchor {
  id: string;
  keyword: string;
  url: string;
}

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  content: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface BlogData {
  _id: string;
  content: {
    topic: string;
    summary: string;
    headings: HeadingItem[];
    conclusion: string;
    faqs: FAQItem[];
    compiledHtml: string;
  };
  seo: {
    seoTitle: string;
    seoDescription: string;
    focusKeyword: string;
    canonicalUrl: string;
    tags: string[];
    author: string;
    publishDate: string;
    anchors: Anchor[];
  };
  media: {
    mediaLibrary: MediaItem[];
    featuredImage: string;
  };
  status: string;
  slug: string;
  generationProgress: {
    currentStep: string;
    currentHeadingIndex: number;
    headingsApproved: boolean;
    imagesApproved: boolean;
    contentApproved: boolean[];
    summaryApproved: boolean;
    conclusionApproved: boolean;
    faqApproved: boolean;
    seoApproved: boolean;
  };
}

interface EditBlogProps {
  initialData: BlogData;
  blogId: string;
  onBack: () => void;
}

// ============================================================================
// EDIT BLOG COMPONENT
// ============================================================================

export default function EditBlog({
  initialData,
  blogId,
  onBack,
}: EditBlogProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState("content");
  const [generationMode, setGenerationMode] = useState<"step" | "full">("step");

  // Blog data state - initialize from initialData
  const [data, setData] = useState({
    topic: initialData.content?.topic || "",
    summary: initialData.content?.summary || "",
    headings: initialData.content?.headings || [],
    conclusion: initialData.content?.conclusion || "",
    faqs: initialData.content?.faqs || [],
    compiledHtml: initialData.content?.compiledHtml || "",

    // SEO fields
    seoTitle: initialData.seo?.seoTitle || "",
    seoDescription: initialData.seo?.seoDescription || "",
    focusKeyword: initialData.seo?.focusKeyword || "",
    canonicalUrl: initialData.seo?.canonicalUrl || "",
    tags: initialData.seo?.tags || [],
    author: initialData.seo?.author || "",
    publishDate: initialData.seo?.publishDate || "",
    anchors: initialData.seo?.anchors || [],

    // Media
    mediaLibrary: initialData.media?.mediaLibrary || [],
    featuredImage: initialData.media?.featuredImage || "",

    // Status
    status: initialData.status || "draft",
    slug: initialData.slug || "",
  });

  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(
    initialData.media?.mediaLibrary || [],
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingMediaId, setUploadingMediaId] = useState<string | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Editor setup - always call useEditor but configure for SSR
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#fe9a00] underline cursor-pointer" },
      }),
      Color,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Placeholder.configure({ placeholder: "Start writing your blog post..." }),
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: { class: "rounded-lg shadow-lg max-w-full" },
      }),
      HorizontalRule,
      BulletList,
      OrderedList,
      ListItem,
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Blockquote,
      CodeBlock,
      Mention.configure({
        HTMLAttributes: {
          class: "text-[#fe9a00] bg-[#fe9a00]/10 px-1 rounded",
        },
      }),
    ],
    immediatelyRender: false,
    content: data.compiledHtml || data.summary || "<p></p>",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setData((prev) => ({ ...prev, compiledHtml: html, summary: html }));
    },
  });

  // Load initial content into editor
  useEffect(() => {
    if (editor && data.compiledHtml) {
      editor.commands.setContent(data.compiledHtml);
    }
  }, [editor]);

  // Get auth token
  const getAuthToken = useCallback(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || localStorage.getItem("authToken");
    }
    return null;
  }, []);

  // Handle data update from StepByStepBlogGenerator
  const handleStepDataUpdate = (newData: any) => {
    setData((prev) => ({ ...prev, ...newData }));

    // Update media library if provided
    if (newData.mediaLibrary) {
      setMediaLibrary(newData.mediaLibrary);
    }

    // Update editor content if summary or compiledHtml changed
    if (editor && (newData.summary || newData.compiledHtml)) {
      const content = newData.compiledHtml || newData.summary || "<p></p>";
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  };

  // Handle step generation complete
  const handleStepGenerationComplete = () => {
    showToast.success("Blog generation completed!");
  };

  // Save blog
  const handleSave = async () => {
    // Validate required SEO fields
    if (!data.seoTitle || data.seoTitle.trim() === "") {
      showToast.error("SEO Title is required. Please enter a SEO Title.");
      return;
    }
    if (!data.canonicalUrl || data.canonicalUrl.trim() === "") {
      showToast.error("Canonical URL is required. Please enter a Canonical URL.");
      return;
    }

    try {
      const token = getAuthToken();

      // Compile final HTML
      const summaryHtml = data.summary || editor?.getHTML() || "";
      const headingsHtml = data.headings
        .map(
          (h) =>
            `<h${h.level} id="${h.id}">${h.text}</h${h.level}>${h.content || ""}`,
        )
        .join("\n");
      const conclusionHtml = data.conclusion
        ? `<h2>Conclusion</h2>${data.conclusion}`
        : "";
      const faqHtml = data.faqs
        .map((f) => `<h3>${f.question}</h3><p>${f.answer}</p>`)
        .join("\n");
      const compiledHtml = `${summaryHtml}\n${headingsHtml}\n${conclusionHtml}\n${faqHtml}`;

      // Calculate word count
      const textContent = summaryHtml + headingsHtml + conclusionHtml + faqHtml;
      const wordCount = textContent
        .replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter(Boolean).length;
      const readingTime = Math.ceil(wordCount / 200);

      const response = await fetch(`/api/blog?id=${blogId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          content: {
            topic: data.topic,
            summary: summaryHtml,
            headings: data.headings,
            conclusion: data.conclusion,
            faqs: data.faqs,
            compiledHtml: compiledHtml,
          },
          seo: {
            seoTitle: data.seoTitle,
            seoDescription: data.seoDescription,
            focusKeyword: data.focusKeyword,
            canonicalUrl: data.canonicalUrl,
            tags: data.tags,
            author: data.author,
            publishDate: data.publishDate,
            anchors: data.anchors,
          },
          media: {
            mediaLibrary: mediaLibrary,
            featuredImage: data.featuredImage,
          },
          status: data.status,
          slug: data.slug,
          wordCount,
          readingTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save blog");
      }

      showToast.success("Blog saved successfully!");
    } catch (error: any) {
      console.log("Save error:", error);
      showToast.error(error.message || "Failed to save blog");
    }
  };

  // Delete media item
  const handleDeleteMedia = useCallback(
    async (mediaId: string) => {
      const mediaItem = mediaLibrary.find((m) => m.id === mediaId);
      if (!mediaItem) return;

      try {
        setMediaLibrary((prev) => prev.filter((m) => m.id !== mediaId));
        showToast.success("Media deleted from library");
      } catch (error) {
        console.log("Delete media error:", error);
        showToast.error("Failed to delete media");
      }
    },
    [mediaLibrary],
  );

  // Get status badge
  const getStatusBadge = () => {
    switch (data.status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <FiCheckCircle size={10} />
            Published
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <FiEdit3 size={10} />
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <FiArchive size={10} />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] py-20">
      {/* Header */}
      <div className="bg-[#1e293b] border-b border-slate-700 sticky top-20 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white">Edit Blog</h1>
              <p className="text-xs text-slate-400">ID: {blogId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge()}
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-[#fe9a00] hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FiSave size={16} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto">
          {[
            { id: "content", label: "Content", icon: <FiEdit3 size={14} /> },
            { id: "seo", label: "SEO", icon: <FiGlobe size={14} /> },
            { id: "media", label: "Media", icon: <FiImage size={14} /> },
            { id: "ai", label: "AI Step-by-Step", icon: <FiCpu size={14} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#fe9a00]/20 text-[#fe9a00] border border-[#fe9a00]/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main Editor */}
            <div className="lg:col-span-2 space-y-4">
              {/* Topic */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
                  Topic / Title
                </label>
                <input
                  type="text"
                  value={data.topic}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, topic: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-[#0f172a] border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#fe9a00]"
                  placeholder="Enter your blog topic..."
                />
              </div>

              {/* Rich Text Editor */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border-b border-slate-700 bg-[#0f172a]">
                  {/* Text Formatting */}
                  <div className="flex gap-1 border-r border-slate-700 pr-2">
                    <button
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("bold") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Bold"
                    >
                      <FiBold size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("italic") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Italic"
                    >
                      <FiItalic size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleUnderline().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("underline") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Underline"
                    >
                      <FiUnderline size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleStrike().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("strike") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Strikethrough"
                    >
                      <FiX size={16} />
                    </button>
                  </div>

                  {/* Headings */}
                  <div className="flex gap-1 border-r border-slate-700 pr-2">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: level as 1 | 2 | 3 })
                            .run()
                        }
                        className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("heading", { level }) ? "text-[#fe9a00]" : "text-slate-400"}`}
                        title={`Heading ${level}`}
                      >
                        <FiType size={16} />
                      </button>
                    ))}
                  </div>

                  {/* Lists */}
                  <div className="flex gap-1 border-r border-slate-700 pr-2">
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("bulletList") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Bullet List"
                    >
                      <FiList size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("orderedList") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Numbered List"
                    >
                      <FiHash size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleTaskList().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("taskList") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Task List"
                    >
                      <FiCheckSquare size={16} />
                    </button>
                  </div>

                  {/* Alignment */}
                  <div className="flex gap-1 border-r border-slate-700 pr-2">
                    <button
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("left").run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive({ textAlign: "left" }) ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Align Left"
                    >
                      <FiAlignLeft size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("center").run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive({ textAlign: "center" }) ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Align Center"
                    >
                      <FiAlignCenter size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().setTextAlign("right").run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive({ textAlign: "right" }) ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Align Right"
                    >
                      <FiAlignRight size={16} />
                    </button>
                  </div>

                  {/* Blocks */}
                  <div className="flex gap-1 border-r border-slate-700 pr-2">
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleBlockquote().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("blockquote") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Quote"
                    >
                      <FiMessageSquare size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().toggleCodeBlock().run()
                      }
                      className={`p-2 rounded hover:bg-slate-700 ${editor?.isActive("codeBlock") ? "text-[#fe9a00]" : "text-slate-400"}`}
                      title="Code Block"
                    >
                      <FiCode size={16} />
                    </button>
                    <button
                      onClick={() =>
                        editor?.chain().focus().setHorizontalRule().run()
                      }
                      className="p-2 rounded hover:bg-slate-700 text-slate-400"
                      title="Horizontal Line"
                    >
                      <FiMinus size={16} />
                    </button>
                  </div>

                  {/* Insert */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        const url = window.prompt("Enter image URL:");
                        if (url)
                          editor?.chain().focus().setImage({ src: url }).run();
                      }}
                      className="p-2 rounded hover:bg-slate-700 text-slate-400"
                      title="Insert Image"
                    >
                      <FiImage size={16} />
                    </button>
                    <button
                      onClick={() => {
                        const url = window.prompt("Enter link URL:");
                        if (url)
                          editor?.chain().focus().setLink({ href: url }).run();
                      }}
                      className="p-2 rounded hover:bg-slate-700 text-slate-400"
                      title="Insert Link"
                    >
                      <FiLink size={16} />
                    </button>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="p-4 min-h-100 max-h-150 overflow-y-auto">
                  {mounted && editor ? (
                    <EditorContent
                      editor={editor}
                      className="prose prose-invert max-w-none"
                    />
                  ) : (
                    <div className="text-slate-400">Loading editor...</div>
                  )}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setViewMode("desktop")}
                  className={`p-2 rounded-lg ${viewMode === "desktop" ? "bg-[#fe9a00] text-white" : "bg-slate-700 text-slate-400"}`}
                >
                  <FiMonitor size={16} />
                </button>
                <button
                  onClick={() => setViewMode("tablet")}
                  className={`p-2 rounded-lg ${viewMode === "tablet" ? "bg-[#fe9a00] text-white" : "bg-slate-700 text-slate-400"}`}
                >
                  <FiTablet size={16} />
                </button>
                <button
                  onClick={() => setViewMode("mobile")}
                  className={`p-2 rounded-lg ${viewMode === "mobile" ? "bg-[#fe9a00] text-white" : "bg-slate-700 text-slate-400"}`}
                >
                  <FiSmartphone size={16} />
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Status & Actions */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Status
                </h3>
                <select
                  value={data.status}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white focus:outline-none focus:border-[#fe9a00]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Headings */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  Headings ({data.headings.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.headings.map((heading, index) => (
                    <div
                      key={heading.id}
                      className="p-2 bg-[#0f172a] rounded-lg"
                    >
                      <p className="text-xs text-slate-400 mb-1">
                        H{heading.level} •{" "}
                        {heading.content ? "With content" : "No content"}
                      </p>
                      <p className="text-sm text-white truncate">
                        {heading.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQs */}
              <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-3">
                  FAQs ({data.faqs.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.faqs.map((faq) => (
                    <div key={faq.id} className="p-2 bg-[#0f172a] rounded-lg">
                      <p className="text-xs text-slate-400 mb-1">Q:</p>
                      <p className="text-sm text-white truncate">
                        {faq.question}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "seo" && (
          <div className="max-w-2xl space-y-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                SEO Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    value={data.seoTitle}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, seoTitle: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white"
                    placeholder="Enter SEO title..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {data.seoTitle.length}/60 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={data.seoDescription}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        seoDescription: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white h-24 resize-none"
                    placeholder="Enter meta description..."
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {data.seoDescription.length}/160 characters
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Focus Keyword
                  </label>
                  <input
                    type="text"
                    value={data.focusKeyword}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        focusKeyword: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white"
                    placeholder="Enter focus keyword..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={data.tags.join(", ")}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        tags: e.target.value
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean),
                      }))
                    }
                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white"
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={data.slug}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="w-full px-4 py-2 bg-[#0f172a] border border-slate-600 rounded-lg text-white"
                    placeholder="blog-slug"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="space-y-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-4">
                Media Library ({mediaLibrary.length})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaLibrary.map((media) => (
                  <div key={media.id} className="relative group">
                    {media.type === "image" ? (
                      <img
                        src={media.url}
                        alt={media.alt}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-32 bg-slate-700 flex items-center justify-center rounded-lg">
                        <FiVideo size={32} className="text-slate-400" />
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteMedia(media.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={14} />
                    </button>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                      {media.alt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <StepByStepBlogGenerator
            topic={data.topic}
            data={{
              seoTitle: data.seoTitle,
              seoDescription: data.seoDescription,
              focusKeyword: data.focusKeyword,
              tags: data.tags,
              author: data.author,
              publishDate: data.publishDate,
              headings: data.headings,
              canonicalUrl: data.canonicalUrl,
              summary: data.summary,
              conclusion: data.conclusion,
              faqs: data.faqs,
              anchors: data.anchors,
              mediaLibrary: mediaLibrary,
            }}
            onDataUpdate={handleStepDataUpdate}
            onComplete={handleStepGenerationComplete}
          />
        )}
      </div>
    </div>
  );
}

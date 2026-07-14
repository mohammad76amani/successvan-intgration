"use client";

import { JSX, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import TableOfContents from "./TableOfContents";
import VanListing, { Category } from "@/components/global/vanListingBackup";
import Image from "next/image";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface BlogDetailClientProps {
  content: string;
}

interface VanListConfig {
  title: string;
  subtitle: string;
  selectedVans: string[];
  showReservation: boolean;
}

export default function BlogDetailClient({ content }: BlogDetailClientProps) {
  const contentRef = useRef<HTMLDivElement>(null!);
  const [mounted, setMounted] = useState(false);
  const [sanitizedContent, setSanitizedContent] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [contentKey, setContentKey] = useState(0);
  const [vanListings, setVanListings] = useState<
    Array<{ config: VanListConfig; index: number }>
  >([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const imageClickHandlers = useRef<Map<HTMLImageElement, () => void>>(
    new Map(),
  );

  useEffect(() => {
    fetch("/api/categories?status=active")
      .then((res) => res.json())
      .then((data) => {
        const cats = data?.data?.data || data?.data || data?.categories || [];
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch((err) => console.log("Failed to fetch categories:", err));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("dompurify").then((module) => {
        const DOMPurify = module.default;

        const configs: VanListConfig[] = [];
        const regex =
          /<div[^>]*class="van-listing-container"[^>]*data-van-config='([^']*)'/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          try {
            configs.push(JSON.parse(match[1]));
          } catch (e) {
            console.log("Failed to parse:", e);
          }
        }

        let processed = content.replace(
          /<div[^>]*class="van-listing-container"[^>]*data-van-config='[^']*'[^>]*>[\s\S]*?<\/div>/g,
          (match) => {
            const idx = configs.findIndex((c, i) =>
              match.includes(JSON.stringify(c)),
            );
            return `<div class="van-placeholder" data-index="${idx >= 0 ? idx : configs.length}"></div>`;
          },
        );

        const sanitized = DOMPurify.sanitize(processed, {
          ALLOWED_TAGS: [
            "p",
            "br",
            "img",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "strong",
            "em",
            "u",
            "s",
            "span",
            "a",
            "ul",
            "ol",
            "li",
            "blockquote",
            "code",
            "pre",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "figure",
            "figcaption",
            "div",
            "hr",
            "mark",
          ],
          ALLOWED_ATTR: [
            "class",
            "style",
            "src",
            "alt",
            "title",
            "href",
            "target",
            "rel",
            "dir",
            "width",
            "height",
            "loading",
            "decoding",
            "bgcolor",
            "background",
            "data-color",
            "data-index",
            "id",
          ],
        });

        let final = sanitized.replace(
          /<mark\s+data-color="([^"]*)"[^>]*>/gi,
          (match, color) =>
            `<mark style="background-color: ${color};" data-color="${color}">`,
        );

        final = final.replace(
          /<img([^>]*)src="([^"]*)"([^>]*)>/gi,
          (match, before, src, after) => {
            if (match.includes('loading="')) return match;
            return `<img${before}src="${src}" loading="lazy" decoding="async"${after}>`;
          },
        );

        setSanitizedContent(final);
        setVanListings(configs.map((config, index) => ({ config, index })));
        setContentKey((prev) => prev + 1);
        setMounted(true);
      });
    }
  }, [content]);

  useEffect(() => {
    if (!mounted || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
      );
    }, contentRef);

    return () => ctx.revert();
  }, [mounted, contentKey]);

  // Handle image clicks for modal - re-run when modal closes to re-attach handlers
  useEffect(() => {
    if (!contentRef.current) return;

    // If modal is open, don't re-attach handlers (they won't be needed anyway)
    if (selectedImage) return;

    // Clean up previous handlers
    imageClickHandlers.current.forEach((handler, img) => {
      img.removeEventListener("click", handler);
    });
    imageClickHandlers.current.clear();

    // Small delay to ensure GSAP animation completes
    const timer = setTimeout(() => {
      const images = contentRef.current?.querySelectorAll("img");

      images?.forEach((img) => {
        // Add loaded class when image loads
        if (img.complete) {
          img.classList.add("loaded");
        } else {
          img.addEventListener("load", function () {
            img.classList.add("loaded");
          });
        }

        const handler = () => {
          if (img.src) {
            setSelectedImage(img.src);
          }
        };
        imageClickHandlers.current.set(img, handler);
        (img as HTMLElement).style.cursor = "zoom-in";
        img.addEventListener("click", handler);
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      // Clean up handlers on unmount
      imageClickHandlers.current.forEach((handler, img) => {
        img.removeEventListener("click", handler);
      });
      imageClickHandlers.current.clear();
    };
  }, [mounted, contentKey, sanitizedContent, selectedImage]);

  const renderContent = () => {
    if (!sanitizedContent) return null;

    const parts = sanitizedContent.split(
      /<div class="van-placeholder" data-index="(\d+)"><\/div>/,
    );
    const elements: JSX.Element[] = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        if (parts[i]) {
          elements.push(
            <div
              key={`content-${i}`}
              dangerouslySetInnerHTML={{ __html: parts[i] }}
            />,
          );
        }
      } else {
        const idx = parseInt(parts[i]);
        const listing = vanListings[idx];
        if (listing && categories.length > 0) {
          const filteredVans =
            listing.config.selectedVans &&
            listing.config.selectedVans.length > 0
              ? categories.filter(
                  (cat) =>
                    cat._id && listing.config.selectedVans.includes(cat._id),
                )
              : categories;

          elements.push(
            <div key={`van-${idx}`} className="van-list-wrapper my-6">
              <VanListing vans={filteredVans} showHeader={false} />
            </div>,
          );
        }
      }
    }

    return elements;
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-color-scheme: dark) {
          .blog-content p:not([style*="color"]),
          .blog-content span:not([style*="color"]),
          .blog-content li:not([style*="color"]) {
            color: #d1d5db !important;
          }
        }
        .blog-content img,
        .blog-content > div > img,
        .blog-content > div > p > img,
        .blog-content > div > figure > img,
        .blog-content figure img {
          aspect-ratio: 16 / 9;
          width: 100% !important;
          height: auto;
          object-fit: cover;
          min-height: 200px;
          background-color: #1e293b;
          border-radius: 1.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          margin: 1.5rem 0;
          pointer-events: auto !important;
          cursor: zoom-in !important;
          position: relative;
        }
        .blog-content img::before,
        .blog-content > div > img::before,
        .blog-content > div > p > img::before,
        .blog-content > div > figure > img::before,
        .blog-content figure img::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 1.5rem;
          z-index: 1;
        }
        .blog-content img.loaded::before,
        .blog-content > div > img.loaded::before,
        .blog-content > div > p > img.loaded::before,
        .blog-content > div > figure > img.loaded::before,
        .blog-content figure img.loaded::before {
          display: none;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .blog-content img:hover,
        .blog-content > div > img:hover,
        .blog-content > div > p > img:hover,
        .blog-content > div > figure > img:hover {
          transform: scale(1.02);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }
        .blog-content h1 {
          color: white !important;
          font-weight: 700 !important;
          font-size: 1.875rem !important;
          margin-bottom: 1rem !important;
          margin-top: 2rem !important;
        }
        .blog-content h1::before {
          content: attr(data-text);
          display: block;
        }
        .blog-content h2 {
          color: white !important;
          font-weight: 800 !important;
          font-size: 1.8rem !important;
                    line-height:1.2;

          margin-bottom: 1.3rem !important;
          margin-top: 1.5rem !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }
        .blog-content h2::before {
          content: attr(data-text);
          display: block;
        }
        .blog-content h3 {
          color: white !important;
          font-weight: 700 !important;
          font-size: 1.5rem !important;
          margin-bottom: 0.75rem !important;
          margin-top: 1.25rem !important;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
         }
        .blog-content h3::before {
          content: attr(data-text);
          display: block;
        }
        .van-list-wrapper > section {
          background: transparent !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
         }
        .van-list-wrapper section .grid {
          gap: 0.75rem !important;
          grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
        }
        @media (min-width: 1024px) {
          .van-list-wrapper section .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          /* Make last item full width when there's an odd number of items */
          .van-list-wrapper section .grid > *:last-child:nth-child(odd) {
            grid-column: span 2 !important;
          }
        }
        .van-list-wrapper section .max-w-7xl {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .cta-block {
          padding: 2rem;
          border-radius: 1rem;
          text-align: center;
          margin: 2rem 0;
          width: 100%;
        }
      `}</style>

      <div
        className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative"
        key={contentKey}
      >
        <div className="lg:col-span-1">
          <TableOfContents contentRef={contentRef} />
        </div>

        <div
          ref={contentRef}
          className="blog-content prose leading-6.75 prose-invert max-w-none lg:col-span-3
            prose-a:text-[#fe9a00] hover:prose-a:text-white
               
            prose-code:bg-slate-800 prose-code:text-[#fe9a00]
            prose-blockquote:border-[#fe9a00]"
        >
          {renderContent()}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-9999 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(15px) saturate(180%)",
            WebkitBackdropFilter: "blur(15px) saturate(180%)",
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#fe9a00] transition-colors z-10000"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <Image
              src={selectedImage}
              width={1000}
              height={1000}
              alt="Full size"
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
              style={{ animation: "fadeIn 0.3s ease" }}
            />
          </div>
        </div>
      )}
    </>
  );
}

import Link from "next/link";
import React from "react";

interface ThemeColors {
  primary: string; // Used for titles/headlines
  secondary: string; // Used for borders and subtle accents
  background: string; // Card background (supports rgba for glassmorphism)
  text: string; // Body/description text
  accent: string; // CTA text, icon, hover states
}

interface ReadMoreData {
  linkUrl: string;
  title: string;
  description: string;
  iconType?: "arrow" | "chevron" | "custom";
  themeColors: ThemeColors;
}

interface ReadMoreProps {
  data: ReadMoreData;
  layout?: "horizontal" | "compact";
  /** Optional custom icon (only used when iconType === "custom") */
  customIcon?: React.ReactNode;
}

export const ReadMore: React.FC<ReadMoreProps> = ({
  data,
  layout = "horizontal",
  customIcon,
}) => {
  const { linkUrl, title, description, iconType = "arrow", themeColors } = data;
  const isHorizontal = layout === "horizontal";

  // Icon renderer with smooth hover animation
  const renderIcon = () => {
    const iconClass =
      "md:w-6 md:h-6 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1";

    if (iconType === "custom" && customIcon) {
      return (
        <span className="flex items-center justify-center">{customIcon}</span>
      );
    }

    if (iconType === "chevron") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={iconClass}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      );
    }

    // Default: modern arrow
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={iconClass}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 5l7 7-7 7M5 12h14"
        />
      </svg>
    );
  };

  return (
    <Link
      href={linkUrl}
      target="_blank"
      className={`
        group block relative overflow-hidden
        bg-background
        border-l-4 border-(--primary) my-4  
        rounded-3xl
        shadow-xl hover:shadow-2xl
        transition-all duration-300
        hover:border-(--accent)
        focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-(--accent)/30
        ${isHorizontal ? "p-8 md:p-10 max-w-2xl" : "p-4 md:p-6"}
        backdrop-blur-xl
      `}
      style={
        {
          "--primary": themeColors.primary,
          "--secondary": themeColors.secondary,
          "--background": themeColors.background,
          "--text": themeColors.text,
          "--accent": themeColors.accent,
        } as React.CSSProperties
      }
      aria-label={`Read more about ${title}`}
    >
      {/* Eye-catching subtle background pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-soft-light"
        style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, var(--accent) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, var(--accent) 0%, transparent 50%),
            linear-gradient(135deg, transparent 40%, var(--accent) 41%, transparent 42%)
          `,
          backgroundSize: "120% 120%, 120% 120%, 80px 80px",
        }}
      />

      <div
        className={`
          flex gap-6 relative z-10
          ${
            isHorizontal
              ? "flex-col lg:flex-row lg:items-start"
              : "flex-row items-center"
          }
        `}
      >
        {/* Content area */}
        <div className="flex-1 min-w-0">
          <h3
            className={`
              font-bold tracking-[-0.02em] leading-tight
              text-(--primary)
              ${isHorizontal ? "text-2xl md:text-4xl" : "text-base"}
            `}
          >
            {title}
          </h3>

          <p
            className={`
              mt-4 text-(--accent) leading-relaxed
              ${isHorizontal ? "text-lg md:text-xl" : "text-xs md:text-base line-clamp-2"}
            `}
          >
            {description}
          </p>
        </div>

        {/* CTA + Icon */}
        <div
          className={`
            flex items-center gap-3 shrink-0
            ${isHorizontal ? "mt-6 lg:mt-0" : "mt-0"}
          `}
        >
          <span
            className="
              font-medium uppercase tracking-[0.5px] text-[10px] md:text-base
              text-(--accent)
            "
          >
            Read more
          </span>
          <div className="text-(--accent)">{renderIcon()}</div>
        </div>
      </div>
    </Link>
  );
};

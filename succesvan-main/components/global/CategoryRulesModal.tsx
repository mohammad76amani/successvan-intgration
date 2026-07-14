"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FiX, FiAlertCircle, FiInfo } from "react-icons/fi";

interface Rule {
  key: string;
  value: string;
}

interface CategoryRulesModalProps {
  categoryId: string;
  onClose: () => void;
}

export default function CategoryRulesModal({
  categoryId,
  onClose,
}: CategoryRulesModalProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

    console.log(categoryId, "categoryId");
    console.log(shouldRender, "shouldRender");

  
  // Use ref to track if we've already fetched for this categoryId
  const fetchedCategoryRef = useRef<string | null>(null);

  // Memoize the fetch function to prevent recreation
  const fetchRules = useCallback(async () => {
    // Prevent duplicate fetches for the same category
    if (fetchedCategoryRef.current === categoryId) {
      return;
    }

    try {
      setLoading(true);
      fetchedCategoryRef.current = categoryId;
      
      const res = await fetch(`/api/categories/${categoryId}`);
      const data = await res.json();

      if (!data.success)
        throw new Error(data.error || "Failed to fetch rules");

      const fetchedRules = data.data.rules || [];

      // Only render modal if rules exist
      if (fetchedRules.length > 0) {
        setRules(fetchedRules);
        setShouldRender(true);
        // Trigger animation after render
        setTimeout(() => setIsVisible(true), 10);
      } else {
        // No rules - close immediately without rendering
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      // Show modal even on error so user knows something went wrong
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
    } finally {
      setLoading(false);
    }
  }, [categoryId, onClose]);

  // Effect to fetch rules only when categoryId changes
  useEffect(() => {
    if (categoryId && categoryId !== fetchedCategoryRef.current) {
      fetchRules();
    }
  }, [categoryId, fetchRules]);

  // Memoize the close handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  // Memoize the rendered rules to prevent unnecessary re-renders
  const renderedRules = useMemo(() => {
    return rules.map((rule, index) => (
      <div
        key={`${rule.key}-${index}`}
        className={`bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-200 transform hover:scale-[1.02] ${
          isVisible ? "animate-fadeInUp" : "opacity-0"
        }`}
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-2 h-2 rounded-full bg-[#fe9a00] mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm sm:text-base mb-1.5 sm:mb-2">
              {rule.key}
            </h4>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              {rule.value}
            </p>
          </div>
        </div>
      </div>
    ));
  }, [rules, isVisible]);

  // Don't render anything until we know there are rules
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* Backdrop with fade animation */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-md z-10001 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal with scale and slide animation */}
      <div className="fixed inset-0 z-10002 flex items-center justify-center p-3 sm:p-4">
        <div
          className={`bg-linear-to-br from-[#0f172b] to-[#1a2744] rounded-2xl sm:rounded-3xl w-full max-w-lg border border-white/10 shadow-2xl transform transition-all duration-300 ease-out max-h-[90vh] flex flex-col ${
            isVisible
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#fe9a00]/10 flex items-center justify-center">
                <FiInfo className="text-[#fe9a00] text-lg sm:text-xl" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base sm:text-lg">
                  Vehicle Rules
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Please review before booking
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <FiX className="text-white text-xl sm:text-2xl" />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="w-12 h-12 sm:w-14 sm:h-14 border-4 border-[#fe9a00]/30 border-t-[#fe9a00] rounded-full animate-spin mb-4" />
                <p className="text-gray-400 text-sm sm:text-base font-medium">
                  Loading rules...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-5 text-center">
                <FiAlertCircle className="text-red-400 text-3xl sm:text-4xl mx-auto mb-3" />
                <p className="text-red-400 text-sm sm:text-base font-medium">
                  {error}
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {renderedRules}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-white/10 shrink-0">
            <button
              onClick={handleClose}
              className="w-full bg-[#fe9a00] hover:bg-orange-500 active:scale-[0.98] text-white font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-lg shadow-[#fe9a00]/25 text-sm sm:text-base"
            >
              Got it, Continue
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out forwards;
        }
      `}</style>
    </>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FiX, FiAlertCircle, FiInfo, FiShield } from "react-icons/fi";

interface Rule {
  key: string;
  value: string;
}

interface CategoryRulesModalProps {
  categoryId: string;
  onClose: () => void;
  showLoadingImmediately?: boolean;
}

export default function CategoryRulesModal({
  categoryId,
  onClose,
  showLoadingImmediately = false,
}: CategoryRulesModalProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(showLoadingImmediately);

    console.log(categoryId, "categoryId");
    console.log(shouldRender, "shouldRender");

  
  // Use ref to track if we've already fetched for this categoryId
  const fetchedCategoryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!showLoadingImmediately) return;

    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, [showLoadingImmediately]);

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
        className={`group rounded-xl border border-[#fe9a00]/20 bg-[#fe9a00]/7 p-4 shadow-lg shadow-black/10 transition-all duration-200 hover:border-[#fe9a00]/45 hover:bg-[#fe9a00]/10 sm:p-5 ${
          isVisible ? "animate-fadeInUp" : "opacity-0"
        }`}
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#fe9a00] text-sm font-black text-white shadow-lg shadow-[#fe9a00]/25">
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="mb-1.5 text-sm font-black text-white sm:mb-2 sm:text-base">
              {rule.key}
            </h4>
            <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
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
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-10001 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal with scale and slide animation */}
      <div className="fixed inset-0 z-10002 flex items-center justify-center p-3 sm:p-4">
        <div
          className={`relative flex max-h-[90vh] w-full max-w-xl transform flex-col overflow-hidden rounded-2xl border border-[#fe9a00]/35 bg-linear-to-br from-[#0f172b] via-[#131d33] to-[#24180a] shadow-2xl shadow-[#fe9a00]/15 transition-all duration-300 ease-out sm:rounded-3xl ${
            isVisible
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-4"
          }`}
        >
          <div className="h-1.5 w-full bg-linear-to-r from-[#fe9a00] via-amber-300 to-[#fe9a00]" />

          {/* Header */}
          <div className="shrink-0 border-b border-[#fe9a00]/20 bg-black/15 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fe9a00] shadow-lg shadow-[#fe9a00]/30 sm:h-13 sm:w-13">
                <FiShield className="text-xl text-white sm:text-2xl" />
              </div>
              <div>
                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-[#fe9a00]">
                  Important
                </p>
                <h3 className="text-lg font-black text-white sm:text-xl">
                  Read Vehicle Rules
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-400 sm:text-sm">
                  These rules affect your booking, pickup, return, and deposit.
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 rounded-lg p-2 transition-colors hover:bg-white/10"
              aria-label="Close rules modal"
            >
              <FiX className="text-white text-xl sm:text-2xl" />
            </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center py-10 sm:py-14">
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fe9a00]/10 ring-1 ring-[#fe9a00]/20">
                  <div className="absolute inset-2 rounded-full border-4 border-[#fe9a00]/20 border-t-[#fe9a00] animate-spin" />
                  <FiInfo className="text-[#fe9a00] text-xl" />
                </div>
                <p className="text-white text-sm sm:text-base font-bold">
                  Preparing vehicle rules
                </p>
                <p className="mt-1 text-center text-gray-500 text-xs sm:text-sm">
                  Checking the latest requirements for this van.
                </p>
                <div className="mt-6 w-full max-w-sm space-y-2.5">
                  {[0, 1, 2].map((item) => (
                    <div
                      key={item}
                      className="h-11 rounded-xl border border-white/10 bg-white/5 animate-pulse"
                    />
                  ))}
                </div>
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
                <div className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="mt-0.5 shrink-0 text-lg text-red-300" />
                    <div>
                      <p className="text-sm font-black text-red-100">
                        Please review every rule before continuing.
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-red-100/70 sm:text-sm">
                        Missing these details may affect your reservation or
                        charges.
                      </p>
                    </div>
                  </div>
                </div>
                {renderedRules}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-[#fe9a00]/20 bg-black/20 p-4 sm:p-5">
            <button
              onClick={handleClose}
              className="w-full rounded-xl bg-[#fe9a00] py-3 text-sm font-black text-white shadow-lg shadow-[#fe9a00]/30 transition-all hover:bg-orange-500 active:scale-[0.98] sm:py-3.5 sm:text-base"
            >
              I have read and understand
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

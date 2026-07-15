"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FiCheckCircle, FiClock, FiFileText, FiRefreshCw } from "react-icons/fi";
import type { SafeContractSummary } from "@/lib/docusign/types";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function errorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return "Request failed";
  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" ? error : "Request failed";
}

export default function SigningCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0f172b] text-white px-4 py-10" />
      }
    >
      <SigningCompleteContent />
    </Suspense>
  );
}

function SigningCompleteContent() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("contractId");
  const [contract, setContract] = useState<SafeContractSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(contractId));
  const [error, setError] = useState("");

  const refreshStatus = async () => {
    if (!contractId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${apiBase}/contracts/${contractId}/status?refresh=true`,
        { headers: authHeaders() },
      );
      const payload = await res.json();
      if (!payload.success) throw new Error(errorMessage(payload));
      setContract(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, [contractId]);

  const completed = contract?.status === "completed";
  const declined = contract?.status === "declined";

  return (
    <main className="min-h-screen bg-[#0f172b] text-white px-4 py-10">
      <section className="max-w-2xl mx-auto bg-[#1a2847] border border-white/10 rounded-2xl p-6 sm:p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#fe9a00]/20 text-[#fe9a00] flex items-center justify-center mb-5">
          {completed ? <FiCheckCircle className="text-4xl" /> : <FiClock className="text-4xl" />}
        </div>
        <h1 className="text-2xl font-black mb-2">
          {completed
            ? "Agreement signed"
            : declined
              ? "Agreement declined"
              : "DocuSign is confirming your agreement"}
        </h1>
        <p className="text-gray-400 mb-6">
          The signing return page is not used as proof of completion. We verify the
          agreement through DocuSign status and webhook events.
        </p>

        {!contractId && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 p-4 mb-6">
            Missing contract ID.
          </div>
        )}
        {loading && <div className="text-gray-400 mb-6">Checking status...</div>}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 p-4 mb-6">
            {error}
          </div>
        )}
        {contract && (
          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-3">
              <FiFileText className="text-[#fe9a00]" />
              <div>
                <p className="font-bold">{contract.contractNumber}</p>
                <p className="text-sm text-gray-400 capitalize">
                  Current status: {contract.status}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {contractId && (
            <button
              onClick={refreshStatus}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold"
            >
              <FiRefreshCw />
              Check again
            </button>
          )}
          <Link
            href="/customerDashboard#contracts"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#fe9a00] hover:bg-[#e68a00] text-slate-950 font-black"
          >
            Back to agreements
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

const wait = (milliseconds: number) =>
  new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export default function SigningCompletePage() {
  const [message, setMessage] = useState("Confirming your signature…");

  useEffect(() => {
    let cancelled = false;

    const finishSigning = async () => {
      const contractId = new URLSearchParams(window.location.search).get(
        "contractId",
      );
      const token = localStorage.getItem("token");

      if (contractId && token) {
        for (let attempt = 0; attempt < 5 && !cancelled; attempt += 1) {
          try {
            const response = await fetch(
              `/api/contracts/${contractId}/status?refresh=true`,
              {
                cache: "no-store",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const payload = await response.json();
            if (payload.success && payload.data?.status === "completed") {
              setMessage("Contract signed successfully. Opening your bookings…");
              break;
            }
          } catch {
            // DocuSign can take a moment to expose the completed envelope.
          }

          if (attempt < 4) await wait(1_200);
        }
      }

      if (!cancelled) {
        window.location.replace("/customerDashboard?contractSigned=1#reserves");
      }
    };

    void finishSigning();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f172b] px-4 text-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fe9a00]/25 border-t-[#fe9a00]" />
        <h1 className="mt-5 text-xl font-black text-white">Finalising contract</h1>
        <p className="mt-2 text-sm text-gray-300">{message}</p>
      </div>
    </main>
  );
}

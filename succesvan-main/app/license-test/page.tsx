"use client";

import { FormEvent, useEffect, useState } from "react";

type ApiResult = Record<string, unknown>;

export default function LicenseTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/extract-license", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ApiResult;
      setResult(data);
    } catch {
      setResult({ error: "Could not connect to the extraction API." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold">Driver licence extractor</h1>
        <p className="mt-2 text-sm text-slate-600">
          Upload a JPEG, PNG, or WebP image (maximum 10 MB).
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setResult(null);
            }}
            className="block w-full rounded-lg border border-slate-300 p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:font-medium file:text-white"
          />

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- local object URLs are not supported by next/image.
            <img
              src={previewUrl}
              alt="Selected driver licence"
              className="max-h-72 w-full rounded-lg border border-slate-200 object-contain"
            />
          )}

          <button
            type="submit"
            disabled={!file || loading}
            className="w-full rounded-lg bg-orange-500 px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Extracting…" : "Extract information"}
          </button>
        </form>

        {result && (
          <pre className="mt-6 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-emerald-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

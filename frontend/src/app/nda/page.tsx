"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import NdaChat from "@/components/NdaChat";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, NdaFormData } from "@/lib/generateNda";
import { useAuth } from "@/lib/auth";
import { useSaveDocument } from "@/lib/useSaveDocument";

function SaveStatusLabel({ status }: { status: string }) {
  if (status === "saving") return <span className="text-xs text-brand-gray">Saving…</span>;
  if (status === "saved") return <span className="text-xs text-green-600">Saved ✓</span>;
  if (status === "error") return <span className="text-xs text-red-500">Save failed</span>;
  return null;
}

function NdaPageInner() {
  const { loading: authLoading, user } = useAuth(true);
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("doc");

  const [formData, setFormData] = useState<NdaFormData>(() => ({
    ...defaultFormData,
    effectiveDate: new Date().toISOString().split("T")[0],
  }));
  const [fieldsLoaded, setFieldsLoaded] = useState(!docIdParam);

  const { savedId, setSavedId, saveStatus, save } = useSaveDocument(
    docIdParam ? Number(docIdParam) : null
  );

  useEffect(() => {
    if (!docIdParam || authLoading || !user) return;
    fetch(`/api/saved-documents/${docIdParam}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.fields) {
          setFormData((prev) => ({ ...prev, ...data.fields }));
          setSavedId(data.id);
        }
      })
      .catch(console.error)
      .finally(() => setFieldsLoaded(true));
  }, [docIdParam, authLoading]);

  function buildDocName(data: NdaFormData): string {
    const p1 = data.party1Company || data.party1Name;
    const p2 = data.party2Company || data.party2Name;
    if (p1 && p2) return `Mutual NDA — ${p1} & ${p2}`;
    if (p1) return `Mutual NDA — ${p1}`;
    return "Mutual NDA";
  }

  if (authLoading || !fieldsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="animate-pulse text-brand-gray text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      <div className="flex items-center justify-between px-6 py-2 bg-white border-b print:hidden">
        <div>
          <span className="text-sm font-medium text-brand-navy">Mutual NDA Creator</span>
          <span className="ml-2 text-xs text-brand-gray">
            Powered by{" "}
            <a
              href="https://commonpaper.com/standards/mutual-nda/1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              CommonPaper Mutual NDA v1.0
            </a>{" "}
            · CC BY 4.0
          </span>
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusLabel status={saveStatus} />
          <button
            onClick={() => save("Mutual-NDA.md", buildDocName(formData), formData)}
            disabled={saveStatus === "saving"}
            className="text-sm font-medium bg-brand-navy text-white rounded-lg px-4 py-1.5 hover:bg-[#021535] disabled:opacity-50 transition-colors"
          >
            {savedId ? "Update" : "Save"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 shrink-0 flex flex-col border-r bg-white print:hidden">
          <NdaChat data={formData} onChange={setFormData} />
        </div>
        <div className="flex-1 overflow-hidden">
          <NdaPreview data={formData} />
        </div>
      </div>
    </div>
  );
}

export default function NdaPage() {
  return (
    <Suspense>
      <NdaPageInner />
    </Suspense>
  );
}

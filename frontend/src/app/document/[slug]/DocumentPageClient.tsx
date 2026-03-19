"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import DocumentChat from "@/components/DocumentChat";
import DocumentPreview from "@/components/DocumentPreview";
import { defaultDocFormData, DocFormData } from "@/lib/generateDocument";
import { DocConfig } from "@/lib/documentTypes";
import { useAuth } from "@/lib/auth";
import { useSaveDocument } from "@/lib/useSaveDocument";

function SaveStatusLabel({ status }: { status: string }) {
  if (status === "saving") return <span className="text-xs text-brand-gray">Saving…</span>;
  if (status === "saved") return <span className="text-xs text-green-600">Saved ✓</span>;
  if (status === "error") return <span className="text-xs text-red-500">Save failed</span>;
  return null;
}

interface DocumentPageClientProps {
  config: DocConfig;
}

export default function DocumentPageClient({ config }: DocumentPageClientProps) {
  const { loading: authLoading, user } = useAuth(true);
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("doc");

  const [formData, setFormData] = useState<DocFormData>(() => ({
    ...defaultDocFormData,
    effectiveDate: new Date().toISOString().split("T")[0],
  }));
  const [fieldsLoaded, setFieldsLoaded] = useState(!docIdParam);

  const { savedId, setSavedId, saveStatus, save } = useSaveDocument(
    docIdParam ? Number(docIdParam) : null
  );

  // Load saved document fields if ?doc= param present
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

  function buildDocName(data: DocFormData): string {
    const p1 = data.party1Company || data.party1Name;
    const p2 = data.party2Company || data.party2Name;
    if (p1 && p2) return `${config.name} — ${p1} & ${p2}`;
    if (p1) return `${config.name} — ${p1}`;
    return config.name;
  }

  async function handleSave() {
    await save(config.filename, buildDocName(formData), formData);
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

      {/* Subheader */}
      <div className="flex items-center justify-between px-6 py-2 bg-white border-b print:hidden">
        <span className="text-sm font-medium text-brand-navy">{config.name} Creator</span>
        <div className="flex items-center gap-3">
          <SaveStatusLabel status={saveStatus} />
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="text-sm font-medium bg-brand-navy text-white rounded-lg px-4 py-1.5 hover:bg-[#021535] disabled:opacity-50 transition-colors"
          >
            {savedId ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: AI Chat */}
        <div className="w-96 shrink-0 flex flex-col border-r bg-white print:hidden">
          <DocumentChat data={formData} onChange={setFormData} config={config} />
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-hidden">
          <DocumentPreview data={formData} config={config} />
        </div>
      </div>
    </div>
  );
}

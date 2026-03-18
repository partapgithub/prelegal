"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import DocumentChat from "@/components/DocumentChat";
import DocumentPreview from "@/components/DocumentPreview";
import { defaultDocFormData, DocFormData } from "@/lib/generateDocument";
import { DocConfig } from "@/lib/documentTypes";

interface DocumentPageClientProps {
  config: DocConfig;
}

export default function DocumentPageClient({ config }: DocumentPageClientProps) {
  const [formData, setFormData] = useState<DocFormData>(() => ({
    ...defaultDocFormData,
    effectiveDate: new Date().toISOString().split("T")[0],
  }));

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      {/* Subheader */}
      <div className="flex items-center justify-between px-6 py-2 bg-white border-b print:hidden">
        <span className="text-sm font-medium text-brand-navy">{config.name} Creator</span>
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

"use client";

import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import NdaChat from "@/components/NdaChat";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, NdaFormData } from "@/lib/generateNda";

export default function NdaPage() {
  const [formData, setFormData] = useState<NdaFormData>(() => ({
    ...defaultFormData,
    effectiveDate: new Date().toISOString().split("T")[0],
  }));

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />

      {/* Subheader */}
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
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: AI Chat */}
        <div className="w-96 shrink-0 flex flex-col border-r bg-white print:hidden">
          <NdaChat data={formData} onChange={setFormData} />
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-hidden">
          <NdaPreview data={formData} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { defaultFormData, NdaFormData } from "@/lib/generateNda";

export default function Home() {
  // I2: lazy initializer so effectiveDate is set at mount time on the client,
  // avoiding a server/client hydration mismatch from new Date() at module scope.
  const [formData, setFormData] = useState<NdaFormData>(() => ({
    ...defaultFormData,
    effectiveDate: new Date().toISOString().split("T")[0],
  }));

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mutual NDA Creator</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Powered by{" "}
            <a
              href="https://commonpaper.com/standards/mutual-nda/1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              CommonPaper Mutual NDA v1.0
            </a>{" "}
            · CC BY 4.0
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Prototype</span>
      </header>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form */}
        <div className="w-80 shrink-0 overflow-y-auto border-r bg-white print:hidden">
          <NdaForm data={formData} onChange={setFormData} />
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-hidden">
          <NdaPreview data={formData} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import DocumentCard from "@/components/DocumentCard";

interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}

const FILENAME_TO_ROUTE: Record<string, string> = {
  "Mutual-NDA.md": "/nda",
};

export default function DashboardPage() {
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb]">
      <AppHeader />

      <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-brand-navy">Legal Documents</h1>
          <p className="text-brand-gray mt-1">
            Select a document type to get started
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {catalog.map((entry) => (
            <DocumentCard
              key={entry.filename}
              name={entry.name}
              description={entry.description}
              href={FILENAME_TO_ROUTE[entry.filename] ?? null}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

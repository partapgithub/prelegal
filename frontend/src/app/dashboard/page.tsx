"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import DocumentCard from "@/components/DocumentCard";
import { useAuth } from "@/lib/auth";

interface CatalogEntry {
  name: string;
  description: string;
  filename: string;
}

interface SavedDoc {
  id: number;
  doc_type: string;
  doc_name: string;
  created_at: string;
  updated_at: string;
}

const FILENAME_TO_ROUTE: Record<string, string> = {
  "Mutual-NDA.md": "/nda",
  "Mutual-NDA-coverpage.md": "/nda",
  "CSA.md": "/document/CSA",
  "SLA.md": "/document/SLA",
  "Design-Partner-Agreement.md": "/document/Design-Partner-Agreement",
  "PSA.md": "/document/PSA",
  "DPA.md": "/document/DPA",
  "Partnership-Agreement.md": "/document/Partnership-Agreement",
  "Software-License-Agreement.md": "/document/Software-License-Agreement",
  "Pilot-Agreement.md": "/document/Pilot-Agreement",
  "BAA.md": "/document/BAA",
  "AI-Addendum.md": "/document/AI-Addendum",
};

function savedDocRoute(doc: SavedDoc): string {
  const base = FILENAME_TO_ROUTE[doc.doc_type] ?? "/dashboard";
  return `${base}?doc=${doc.id}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const { loading: authLoading } = useAuth(true);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    fetch("/api/documents")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(console.error);

    fetch("/api/saved-documents")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSavedDocs)
      .catch(console.error);
  }, [authLoading]);

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/saved-documents/${id}`, { method: "DELETE" });
      if (res.ok) setSavedDocs((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="animate-pulse text-brand-gray text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f9fafb]">
      <AppHeader />

      <main className="flex-1 px-8 py-10 max-w-7xl mx-auto w-full">

        {/* My Documents */}
        {savedDocs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-brand-navy mb-4">My Documents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-navy line-clamp-2">
                      {doc.doc_name}
                    </p>
                    <p className="text-xs text-brand-gray mt-1">
                      Updated {formatDate(doc.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={savedDocRoute(doc)}
                      className="flex-1 text-center text-sm font-medium bg-brand-blue text-white rounded-lg py-1.5 hover:bg-[#1a88b8] transition-colors"
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="text-sm text-brand-gray hover:text-red-500 transition-colors disabled:opacity-40 px-2"
                      title="Delete"
                    >
                      {deletingId === doc.id ? "…" : "✕"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Document catalog */}
        <section>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-brand-navy">Legal Documents</h1>
            <p className="text-brand-gray mt-1">Select a document type to get started</p>
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
        </section>
      </main>
    </div>
  );
}

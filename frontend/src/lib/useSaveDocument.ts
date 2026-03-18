"use client";

import { useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseSaveDocumentReturn {
  savedId: number | null;
  setSavedId: (id: number | null) => void;
  saveStatus: SaveStatus;
  save: (docType: string, docName: string, fields: object) => Promise<void>;
}

export function useSaveDocument(initialId: number | null = null): UseSaveDocumentReturn {
  const [savedId, setSavedId] = useState<number | null>(initialId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  async function save(docType: string, docName: string, fields: object) {
    if (saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      if (savedId) {
        // Update existing
        const res = await fetch(`/api/saved-documents/${savedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc_type: docType, doc_name: docName, fields }),
        });
        if (!res.ok) throw new Error();
      } else {
        // Create new
        const res = await fetch("/api/saved-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doc_type: docType, doc_name: docName, fields }),
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSavedId(data.id);
        // Update URL without navigation so refreshing reopens this doc
        const url = new URL(window.location.href);
        url.searchParams.set("doc", String(data.id));
        window.history.replaceState(null, "", url.toString());
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }

  return { savedId, setSavedId, saveStatus, save };
}

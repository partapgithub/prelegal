import { DOCUMENT_CONFIGS, ALL_SLUGS } from "@/lib/documentTypes";
import DocumentPageClient from "./DocumentPageClient";

export function generateStaticParams() {
  return ALL_SLUGS.map((slug) => ({ slug }));
}

interface PageProps {
  params: { slug: string };
}

export default function DocumentPage({ params }: PageProps) {
  const config = DOCUMENT_CONFIGS[params.slug];
  // Unknown slugs are not generated at build time; static export falls back to root index.html
  if (!config) return null;

  return <DocumentPageClient config={config} />;
}

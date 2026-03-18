"use client";

import Link from "next/link";

interface DocumentCardProps {
  name: string;
  description: string;
  href: string | null;
}

export default function DocumentCard({ name, description, href }: DocumentCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col gap-3 hover:border-brand-blue hover:shadow-md transition-all">
      <h2 className="text-brand-navy font-semibold text-base">{name}</h2>
      <p className="text-brand-gray text-sm leading-relaxed flex-1">{description}</p>
      {href ? (
        <Link
          href={href}
          className="inline-block mt-auto text-sm font-medium text-white bg-brand-blue hover:bg-[#1a87bc] rounded-lg px-4 py-2 transition-colors text-center"
        >
          Create
        </Link>
      ) : (
        <span className="inline-block mt-auto text-sm font-medium text-brand-gray bg-gray-100 rounded-lg px-4 py-2 text-center cursor-default">
          Coming Soon
        </span>
      )}
    </div>
  );
}

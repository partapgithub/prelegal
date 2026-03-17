"use client";

import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { NdaFormData, generateCoverPageMarkdown, generateStandardTerms } from "@/lib/generateNda";

interface NdaPreviewProps {
  data: NdaFormData;
}

export default function NdaPreview({ data }: NdaPreviewProps) {
  // I9: memoize expensive string builds so they only rerun when data changes
  const coverPage = useMemo(() => generateCoverPageMarkdown(data), [data]);
  const standardTerms = useMemo(() => generateStandardTerms(data), [data]);
  const fullDocument = useMemo(
    () => `${coverPage}\n\n${standardTerms}`,
    [coverPage, standardTerms]
  );

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 print:hidden">
        <h2 className="text-lg font-bold text-gray-800">Document Preview</h2>
        {/* I1: renamed from "Download PDF" to accurately describe the action */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Print / Save as PDF
        </button>
      </div>

      {/* Document */}
      <div className="flex-1 overflow-y-auto p-8 bg-white" id="nda-document">
        <div className="max-w-3xl mx-auto prose prose-sm prose-gray">
          {/* C1: rehypeSanitize prevents HTML injection from user input */}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-gray-800 mb-3 mt-6 border-b pb-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-bold text-gray-800 mb-2 mt-4">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-700 text-sm leading-relaxed mb-3">{children}</p>
              ),
              table: ({ children }) => (
                <table className="w-full border-collapse border border-gray-300 text-sm my-4">
                  {children}
                </table>
              ),
              th: ({ children }) => (
                <th className="border border-gray-300 px-3 py-2 bg-gray-50 text-left font-semibold text-gray-700">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="border border-gray-300 px-3 py-2 text-gray-700 min-h-8">
                  {children}
                </td>
              ),
              hr: () => <hr className="my-8 border-gray-300" />,
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              em: ({ children }) => (
                <em className="text-gray-500 not-italic text-xs">{children}</em>
              ),
              li: ({ children }) => (
                <li className="text-gray-700 text-sm mb-1">{children}</li>
              ),
            }}
          >
            {fullDocument}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

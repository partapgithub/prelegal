"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NdaFormData, generateCoverPageMarkdown, generateStandardTerms } from "@/lib/generateNda";

interface NdaPreviewProps {
  data: NdaFormData;
}

export default function NdaPreview({ data }: NdaPreviewProps) {
  const coverPage = generateCoverPageMarkdown(data);
  const standardTerms = generateStandardTerms(data);
  const fullDocument = `${coverPage}\n\n${standardTerms}`;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50 print:hidden">
        <h2 className="text-lg font-bold text-gray-800">Document Preview</h2>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download PDF
        </button>
      </div>

      {/* Document */}
      <div className="flex-1 overflow-y-auto p-8 bg-white" id="nda-document">
        <div className="max-w-3xl mx-auto prose prose-sm prose-gray">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Style headings
              h1: ({ children }) => (
                <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl font-bold text-gray-800 mb-3 mt-6 border-b pb-1">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-bold text-gray-800 mb-2 mt-4">{children}</h3>
              ),
              // Style paragraphs
              p: ({ children }) => (
                <p className="text-gray-700 text-sm leading-relaxed mb-3">{children}</p>
              ),
              // Style tables for the signature block
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
              // Horizontal rule (divider between cover page and standard terms)
              hr: () => <hr className="my-8 border-gray-300" />,
              // Strong
              strong: ({ children }) => (
                <strong className="font-semibold text-gray-900">{children}</strong>
              ),
              // Links
              a: ({ href, children }) => (
                <a href={href} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              // Emphasis/italic
              em: ({ children }) => (
                <em className="text-gray-500 not-italic text-xs">{children}</em>
              ),
              // List items
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

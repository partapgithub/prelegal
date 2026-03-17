"use client";

import { NdaFormData } from "@/lib/generateNda";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
        {hint && <span className="text-xs font-normal text-gray-400 ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function set<K extends keyof NdaFormData>(field: K, value: NdaFormData[K]) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="p-6 space-y-6 print:hidden">
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Agreement Details</h2>

      {/* Purpose */}
      <Field label="Purpose" hint="How Confidential Information may be used">
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={data.purpose}
          onChange={(e) => set("purpose", e.target.value)}
          placeholder="Evaluating whether to enter into a business relationship..."
        />
      </Field>

      {/* Effective Date */}
      <Field label="Effective Date">
        <input
          type="date"
          className={inputClass}
          value={data.effectiveDate}
          onChange={(e) => set("effectiveDate", e.target.value)}
        />
      </Field>

      {/* MNDA Term */}
      <Field label="MNDA Term" hint="Length of this agreement">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={data.mndaTermType === "expires"}
              onChange={() => set("mndaTermType", "expires")}
            />
            Expires after
            <input
              type="number"
              min="1"
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              value={data.mndaTermYears}
              onChange={(e) => set("mndaTermYears", e.target.value)}
            />
            year(s) from Effective Date
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={data.mndaTermType === "until_terminated"}
              onChange={() => set("mndaTermType", "until_terminated")}
            />
            Continues until terminated
          </label>
        </div>
      </Field>

      {/* Term of Confidentiality */}
      <Field label="Term of Confidentiality" hint="How long information is protected">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={data.confidentialityTermType === "years"}
              onChange={() => set("confidentialityTermType", "years")}
            />
            <input
              type="number"
              min="1"
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              value={data.confidentialityTermYears}
              onChange={(e) => set("confidentialityTermYears", e.target.value)}
            />
            year(s) from Effective Date
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={data.confidentialityTermType === "perpetuity"}
              onChange={() => set("confidentialityTermType", "perpetuity")}
            />
            In perpetuity
          </label>
        </div>
      </Field>

      {/* Governing Law & Jurisdiction */}
      <Field label="Governing Law" hint="State">
        <input
          type="text"
          className={inputClass}
          value={data.governingLaw}
          onChange={(e) => set("governingLaw", e.target.value)}
          placeholder="e.g. Delaware"
        />
      </Field>

      <Field label="Jurisdiction" hint="City or county and state">
        <input
          type="text"
          className={inputClass}
          value={data.jurisdiction}
          onChange={(e) => set("jurisdiction", e.target.value)}
          placeholder="e.g. courts located in New Castle, DE"
        />
      </Field>

      {/* Modifications */}
      <Field label="MNDA Modifications" hint="optional">
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={data.modifications}
          onChange={(e) => set("modifications", e.target.value)}
          placeholder="List any modifications to the MNDA..."
        />
      </Field>

      {/* Divider */}
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Party 1</h2>

      <Field label="Company">
        <input
          type="text"
          className={inputClass}
          value={data.party1Company}
          onChange={(e) => set("party1Company", e.target.value)}
        />
      </Field>
      <Field label="Print Name">
        <input
          type="text"
          className={inputClass}
          value={data.party1Name}
          onChange={(e) => set("party1Name", e.target.value)}
        />
      </Field>
      <Field label="Title">
        <input
          type="text"
          className={inputClass}
          value={data.party1Title}
          onChange={(e) => set("party1Title", e.target.value)}
        />
      </Field>
      <Field label="Notice Address" hint="email or postal">
        <input
          type="text"
          className={inputClass}
          value={data.party1Address}
          onChange={(e) => set("party1Address", e.target.value)}
        />
      </Field>
      <Field label="Date">
        <input
          type="date"
          className={inputClass}
          value={data.party1Date}
          onChange={(e) => set("party1Date", e.target.value)}
        />
      </Field>

      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Party 2</h2>

      <Field label="Company">
        <input
          type="text"
          className={inputClass}
          value={data.party2Company}
          onChange={(e) => set("party2Company", e.target.value)}
        />
      </Field>
      <Field label="Print Name">
        <input
          type="text"
          className={inputClass}
          value={data.party2Name}
          onChange={(e) => set("party2Name", e.target.value)}
        />
      </Field>
      <Field label="Title">
        <input
          type="text"
          className={inputClass}
          value={data.party2Title}
          onChange={(e) => set("party2Title", e.target.value)}
        />
      </Field>
      <Field label="Notice Address" hint="email or postal">
        <input
          type="text"
          className={inputClass}
          value={data.party2Address}
          onChange={(e) => set("party2Address", e.target.value)}
        />
      </Field>
      <Field label="Date">
        <input
          type="date"
          className={inputClass}
          value={data.party2Date}
          onChange={(e) => set("party2Date", e.target.value)}
        />
      </Field>
    </div>
  );
}

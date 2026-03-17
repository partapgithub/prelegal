"use client";

import { NdaFormData } from "@/lib/generateNda";

interface NdaFormProps {
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}

// C4: Field now accepts htmlFor to properly associate label with its control.
function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-gray-700 mb-1"
      >
        {label}
        {hint && (
          <span className="text-xs font-normal text-gray-400 ml-1">({hint})</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// I3: Clamp year value to a positive integer on change.
function clampYear(raw: string): string {
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 1) return "1";
  return String(n);
}

// I5: Extracted shared component for Party fields.
function PartyFields({
  prefix,
  label,
  data,
  onChange,
}: {
  prefix: "party1" | "party2";
  label: string;
  data: NdaFormData;
  onChange: (data: NdaFormData) => void;
}) {
  function set<K extends keyof NdaFormData>(field: K, value: NdaFormData[K]) {
    onChange({ ...data, [field]: value });
  }

  const companyKey = `${prefix}Company` as keyof NdaFormData;
  const nameKey = `${prefix}Name` as keyof NdaFormData;
  const titleKey = `${prefix}Title` as keyof NdaFormData;
  const addressKey = `${prefix}Address` as keyof NdaFormData;
  const dateKey = `${prefix}Date` as keyof NdaFormData;

  return (
    <>
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">{label}</h2>
      <Field label="Company" htmlFor={`${prefix}-company`}>
        <input
          id={`${prefix}-company`}
          type="text"
          className={inputClass}
          value={data[companyKey] as string}
          onChange={(e) => set(companyKey, e.target.value)}
        />
      </Field>
      <Field label="Print Name" htmlFor={`${prefix}-name`}>
        <input
          id={`${prefix}-name`}
          type="text"
          className={inputClass}
          value={data[nameKey] as string}
          onChange={(e) => set(nameKey, e.target.value)}
        />
      </Field>
      <Field label="Title" htmlFor={`${prefix}-title`}>
        <input
          id={`${prefix}-title`}
          type="text"
          className={inputClass}
          value={data[titleKey] as string}
          onChange={(e) => set(titleKey, e.target.value)}
        />
      </Field>
      <Field label="Notice Address" hint="email or postal" htmlFor={`${prefix}-address`}>
        <input
          id={`${prefix}-address`}
          type="text"
          className={inputClass}
          value={data[addressKey] as string}
          onChange={(e) => set(addressKey, e.target.value)}
        />
      </Field>
      <Field label="Date" htmlFor={`${prefix}-date`}>
        <input
          id={`${prefix}-date`}
          type="date"
          className={inputClass}
          value={data[dateKey] as string}
          onChange={(e) => set(dateKey, e.target.value)}
        />
      </Field>
    </>
  );
}

export default function NdaForm({ data, onChange }: NdaFormProps) {
  function set<K extends keyof NdaFormData>(field: K, value: NdaFormData[K]) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="p-6 space-y-6 print:hidden">
      <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Agreement Details</h2>

      {/* Purpose */}
      <Field label="Purpose" hint="how Confidential Information may be used" htmlFor="purpose">
        <textarea
          id="purpose"
          className={`${inputClass} resize-none`}
          rows={3}
          value={data.purpose}
          onChange={(e) => set("purpose", e.target.value)}
          placeholder="evaluating a potential business relationship..."
        />
      </Field>

      {/* Effective Date */}
      <Field label="Effective Date" htmlFor="effectiveDate">
        <input
          id="effectiveDate"
          type="date"
          className={inputClass}
          value={data.effectiveDate}
          onChange={(e) => set("effectiveDate", e.target.value)}
        />
      </Field>

      {/* MNDA Term — C3: radio groups get name attributes; C4: fieldset/legend for grouping */}
      <fieldset className="mb-4">
        <legend className="block text-sm font-semibold text-gray-700 mb-1">
          MNDA Term <span className="text-xs font-normal text-gray-400">(length of this agreement)</span>
        </legend>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "expires"}
              onChange={() => set("mndaTermType", "expires")}
            />
            Expires after
            <input
              type="number"
              min="1"
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              value={data.mndaTermYears}
              onChange={(e) => set("mndaTermYears", clampYear(e.target.value))}
              aria-label="MNDA term years"
            />
            year(s) from Effective Date
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="mndaTermType"
              checked={data.mndaTermType === "until_terminated"}
              onChange={() => set("mndaTermType", "until_terminated")}
            />
            Continues until terminated
          </label>
        </div>
      </fieldset>

      {/* Term of Confidentiality — C3: name attribute; C4: fieldset/legend */}
      <fieldset className="mb-4">
        <legend className="block text-sm font-semibold text-gray-700 mb-1">
          Term of Confidentiality <span className="text-xs font-normal text-gray-400">(how long information is protected)</span>
        </legend>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "years"}
              onChange={() => set("confidentialityTermType", "years")}
            />
            <input
              type="number"
              min="1"
              className="w-16 border border-gray-300 rounded px-2 py-1 text-sm"
              value={data.confidentialityTermYears}
              onChange={(e) => set("confidentialityTermYears", clampYear(e.target.value))}
              aria-label="Confidentiality term years"
            />
            year(s) from Effective Date
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="confidentialityTermType"
              checked={data.confidentialityTermType === "perpetuity"}
              onChange={() => set("confidentialityTermType", "perpetuity")}
            />
            In perpetuity
          </label>
        </div>
      </fieldset>

      {/* Governing Law & Jurisdiction */}
      <Field label="Governing Law" hint="state" htmlFor="governingLaw">
        <input
          id="governingLaw"
          type="text"
          className={inputClass}
          value={data.governingLaw}
          onChange={(e) => set("governingLaw", e.target.value)}
          placeholder="e.g. Delaware"
        />
      </Field>

      <Field label="Jurisdiction" hint="city or county and state" htmlFor="jurisdiction">
        <input
          id="jurisdiction"
          type="text"
          className={inputClass}
          value={data.jurisdiction}
          onChange={(e) => set("jurisdiction", e.target.value)}
          placeholder="e.g. courts located in New Castle, DE"
        />
      </Field>

      {/* Modifications */}
      <Field label="MNDA Modifications" hint="optional" htmlFor="modifications">
        <textarea
          id="modifications"
          className={`${inputClass} resize-none`}
          rows={2}
          value={data.modifications}
          onChange={(e) => set("modifications", e.target.value)}
          placeholder="List any modifications to the MNDA..."
        />
      </Field>

      {/* I5: Party fields extracted into shared PartyFields component */}
      <PartyFields prefix="party1" label="Party 1" data={data} onChange={onChange} />
      <PartyFields prefix="party2" label="Party 2" data={data} onChange={onChange} />
    </div>
  );
}

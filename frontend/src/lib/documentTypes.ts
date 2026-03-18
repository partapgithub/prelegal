export interface DocConfig {
  name: string;
  filename: string;
  party1Role: string;
  party2Role: string;
  descriptionLabel: string;
}

export const DOCUMENT_CONFIGS: Record<string, DocConfig> = {
  CSA: {
    name: "Cloud Service Agreement",
    filename: "CSA.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "cloud service being provided",
  },
  SLA: {
    name: "Service Level Agreement",
    filename: "SLA.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "service covered by this SLA",
  },
  "Design-Partner-Agreement": {
    name: "Design Partner Agreement",
    filename: "Design-Partner-Agreement.md",
    party1Role: "Provider",
    party2Role: "Partner",
    descriptionLabel: "product being evaluated by the design partner",
  },
  PSA: {
    name: "Professional Services Agreement",
    filename: "PSA.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "services being provided",
  },
  DPA: {
    name: "Data Processing Agreement",
    filename: "DPA.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "data processing activities covered",
  },
  "Partnership-Agreement": {
    name: "Partnership Agreement",
    filename: "Partnership-Agreement.md",
    party1Role: "Company",
    party2Role: "Partner",
    descriptionLabel: "nature of the partnership (e.g., co-marketing, referral)",
  },
  "Software-License-Agreement": {
    name: "Software License Agreement",
    filename: "Software-License-Agreement.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "software being licensed",
  },
  "Pilot-Agreement": {
    name: "Pilot Agreement",
    filename: "Pilot-Agreement.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "product being evaluated in this pilot",
  },
  BAA: {
    name: "Business Associate Agreement",
    filename: "BAA.md",
    party1Role: "Business Associate",
    party2Role: "Covered Entity",
    descriptionLabel: "services provided that involve protected health information",
  },
  "AI-Addendum": {
    name: "AI Addendum",
    filename: "AI-Addendum.md",
    party1Role: "Provider",
    party2Role: "Customer",
    descriptionLabel: "AI/ML features covered by this addendum",
  },
};

export const ALL_SLUGS = Object.keys(DOCUMENT_CONFIGS);

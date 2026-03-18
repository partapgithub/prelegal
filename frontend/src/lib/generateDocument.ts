export interface DocFormData {
  party1Company: string;
  party1Name: string;
  party1Title: string;
  party1Address: string;
  party1Date: string;
  party2Company: string;
  party2Name: string;
  party2Title: string;
  party2Address: string;
  party2Date: string;
  effectiveDate: string;
  term: string;
  description: string;
  fees: string;
  governingLaw: string;
  jurisdiction: string;
}

export const defaultDocFormData: DocFormData = {
  party1Company: "",
  party1Name: "",
  party1Title: "",
  party1Address: "",
  party1Date: "",
  party2Company: "",
  party2Name: "",
  party2Title: "",
  party2Address: "",
  party2Date: "",
  effectiveDate: "",
  term: "",
  description: "",
  fees: "",
  governingLaw: "",
  jurisdiction: "",
};

function escapeCell(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function escapeInline(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/[_*`[\]]/g, "\\$&");
}

export function generateCoverPage(
  data: DocFormData,
  docName: string,
  party1Role: string,
  party2Role: string
): string {
  const effectiveDate = escapeInline(data.effectiveDate || "[Effective Date]");
  const term = escapeInline(data.term || "[Term]");
  const description = escapeInline(data.description || "[Description]");
  const governingLaw = escapeInline(data.governingLaw || "[Governing Law]");
  const jurisdiction = escapeInline(data.jurisdiction || "[Jurisdiction]");

  const keyTermsRows = [
    `| Effective Date | ${effectiveDate} |`,
    `| Agreement Term | ${term} |`,
    `| Description | ${description} |`,
    data.fees ? `| Fees | ${escapeInline(data.fees)} |` : null,
    `| Governing Law | ${governingLaw} |`,
    `| Jurisdiction | ${jurisdiction} |`,
  ]
    .filter(Boolean)
    .join("\n");

  return `# ${docName}

## Key Terms

| Term | Details |
|:---|:---|
${keyTermsRows}

By signing below, each party agrees to enter into this Agreement as of the Effective Date.

| | ${party1Role.toUpperCase()} | ${party2Role.toUpperCase()} |
|:---|:---:|:---:|
| **Signature** | | |
| **Print Name** | ${escapeCell(data.party1Name)} | ${escapeCell(data.party2Name)} |
| **Title** | ${escapeCell(data.party1Title)} | ${escapeCell(data.party2Title)} |
| **Company** | ${escapeCell(data.party1Company)} | ${escapeCell(data.party2Company)} |
| **Notice Address** | ${escapeCell(data.party1Address)} | ${escapeCell(data.party2Address)} |
| **Date** | ${escapeCell(data.party1Date)} | ${escapeCell(data.party2Date)} |`;
}

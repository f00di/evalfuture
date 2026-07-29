import { describe, expect, it } from "vitest";
import { calculatePreview, defaultRequest } from "./model";
import { generateWorkbookBlob, workbookFilename } from "./workbook";

async function storedZipEntries(blob: Blob): Promise<Map<string, string>> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const decoder = new TextDecoder();
  const entries = new Map<string, string>();
  let offset = 0;

  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    expect(method).toBe(0);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + nameLength));
    entries.set(name, decoder.decode(bytes.slice(dataStart, dataStart + size)));
    offset = dataStart + size;
  }
  return entries;
}

describe("browser workbook", () => {
  it("contains exactly two visible sheets with Evalfuture. branding", async () => {
    const entries = await storedZipEntries(
      generateWorkbookBlob(calculatePreview(defaultRequest))
    );
    const workbook = entries.get("xl/workbook.xml") ?? "";
    expect([...workbook.matchAll(/<sheet name=/g)]).toHaveLength(2);
    expect(workbook).toContain('<sheet name="Evalfuture"');
    expect(workbook).toContain('<sheet name="amort"');
    expect(workbook).not.toContain('state="hidden"');
    expect(entries.get("xl/worksheets/sheet1.xml")).toContain(
      "Evalfuture. Property Evaluation Model"
    );
  });

  it("keeps Year 0 chart-ready data display-only and uses exact labels", async () => {
    const entries = await storedZipEntries(
      generateWorkbookBlob(calculatePreview(defaultRequest))
    );
    const sheet = entries.get("xl/worksheets/sheet1.xml") ?? "";
    expect(sheet).toContain("Chart-ready Market Data");
    expect(sheet).toContain("Baseline");
    expect(sheet).toContain("Profit rate your savings can earn per year");
    expect(entries.get("xl/worksheets/sheet2.xml")).not.toContain("Baseline");
  });

  it("exports only the selected loan-term rows and records fallback sources", async () => {
    const preview = calculatePreview({
      ...defaultRequest,
      loanTermYears: 3,
      scenario: "Custom",
      customMarketVariations: [null, -0.05, 0]
    });
    const entries = await storedZipEntries(generateWorkbookBlob(preview));
    const sheet = entries.get("xl/worksheets/sheet1.xml") ?? "";
    const chartSection = sheet.slice(
      sheet.indexOf("Chart-ready Market Data"),
      sheet.indexOf("Rental vs Buying Comparison")
    );
    expect([...chartSection.matchAll(/>Baseline<|>Default<|>Custom</g)]).toHaveLength(4);
    expect([...chartSection.matchAll(/>Default</g)]).toHaveLength(1);
    expect([...chartSection.matchAll(/>Custom</g)]).toHaveLength(2);
  });

  it("creates a safe and meaningful filename", () => {
    expect(workbookFilename(" Marina / 2 BR ")).toBe(
      "Evalfuture-Marina-2-BR.xlsx"
    );
  });
});

import { EvaluationPreview, percent } from "./model";

type CellValue = string | number | null | undefined;

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export function workbookFilename(propertyName: string): string {
  const safeName = propertyName
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `Evalfuture-${safeName || "model"}.xlsx`;
}

export function generateWorkbookBlob(preview: EvaluationPreview): Blob {
  const files = {
    "[Content_Types].xml": contentTypesXml(),
    "_rels/.rels": rootRelationshipsXml(),
    "xl/workbook.xml": workbookXml(),
    "xl/_rels/workbook.xml.rels": workbookRelationshipsXml(),
    "xl/worksheets/sheet1.xml": sheetXml(buildEvalfutureRows(preview)),
    "xl/worksheets/sheet2.xml": sheetXml(buildAmortizationRows(preview))
  };

  return new Blob([zip(files)], { type: XLSX_MIME });
}

function buildEvalfutureRows(preview: EvaluationPreview): CellValue[][] {
  const { inputs, derived } = preview;
  const rows: CellValue[][] = [
    ["Evalfuture. Property Evaluation Model"],
    [],
    ["Assumptions", "Value"],
    ["Property name / description", inputs.propertyName],
    ["Property Net Purchase Price", inputs.propertyNetPurchasePrice],
    ["Area in sq. ft", inputs.areaSqFt],
    ["Down payment %", percent(inputs.downPaymentPct)],
    ["Purchase cost %", percent(inputs.purchaseCostPct)],
    ["Loan payment period in years", inputs.loanTermYears],
    ["Mortgage rate %", percent(inputs.mortgageRatePct)],
    ["Early payment fee %", percent(inputs.earlyPaymentFeePct)],
    ["Current Rent of Property/year %", percent(inputs.rentYieldPct)],
    ["Service Charges Rate/per sq. ft/year", inputs.serviceChargePerSqFt],
    ["Profit rate savings can earn/year", percent(inputs.savingsProfitRatePct)],
    ["Scenario", inputs.scenario],
    [],
    ["Derived Values", "AED"],
    ["Down payment amount", derived.downPaymentAmount],
    ["Purchase cost amount", derived.purchaseCostAmount],
    ["Current rent per year", derived.currentRentPerYear],
    ["Service charges year", derived.serviceChargesYear],
    ["Total initial funds required", derived.totalInitialFundsRequired],
    ["Principal loan", derived.principalLoan],
    ["Monthly bank instalment", derived.monthlyBankInstalment],
    ["Yearly bank instalment", derived.yearlyBankInstalment],
    ["Total bank payment", derived.totalBankPayment],
    ["Total interest", derived.totalInterest],
    ["Service charges month", derived.serviceChargesMonth],
    ["Net rental year", derived.netRentalYear],
    ["Total cost", derived.totalCost],
    [],
    [
      "Year",
      "Default market variation",
      "Default selling price",
      "Custom market variation",
      "Custom selling price",
      "Selected variation",
      "Selected selling price"
    ]
  ];

  preview.marketRows.forEach((row) => {
    rows.push([
      row.year,
      percent(row.defaultMarketVariation),
      row.defaultSellingPrice,
      row.customMarketVariation === null ? "" : percent(row.customMarketVariation),
      row.customSellingPrice,
      percent(row.selectedMarketVariation),
      row.selectedSellingPrice
    ]);
  });

  rows.push(
    [],
    [
      "Year",
      "Rent",
      "Funds Available",
      "Earning on Funds",
      "Rental Net Total",
      "Yearly Bank Instalments",
      "Bank Interest",
      "Bank Principal",
      "Total Principal",
      "Total Cost",
      "Early Settlement Cost",
      "Market Variation",
      "Property Market Price",
      "Net Total / Resale",
      "Options Comparison"
    ]
  );

  preview.comparisonRows.forEach((row) => {
    rows.push([
      row.year,
      row.rent,
      row.fundsAvailable,
      row.earningOnAvailableFunds,
      row.rentalNetTotal,
      row.yearlyBankInstalments,
      row.bankInterest,
      row.bankPrincipal,
      row.totalPrincipal,
      row.totalCost,
      row.earlySettlementCost,
      percent(row.marketVariation),
      row.propertyMarketPrice,
      row.netTotalResale,
      row.optionsComparison
    ]);
  });

  rows.push([
    "Total",
    "",
    "",
    "",
    "",
    preview.totals.yearlyBankInstalments,
    preview.totals.bankInterest,
    preview.totals.bankPrincipal,
    "",
    "",
    "",
    "",
    "",
    "",
    preview.finalOptionsComparison
  ]);

  return rows;
}

function buildAmortizationRows(preview: EvaluationPreview): CellValue[][] {
  const rows: CellValue[][] = [
    ["Evalfuture. Amortization Summary"],
    [],
    [
      "Year",
      "Interest",
      "Principal",
      "Ending Balance",
      "Total Instalment",
      "Interest / Principal",
      "Decrease",
      "Interest / Total Interest"
    ]
  ];

  preview.amortizationSummaryRows.forEach((row) => {
    rows.push([
      row.year,
      row.interest,
      row.principal,
      row.endingBalance,
      row.totalInstalment,
      percent(row.interestPrincipalRatio),
      row.decrease,
      percent(row.interestTotalInterestRatio)
    ]);
  });

  return rows;
}

function sheetXml(rows: CellValue[][]): string {
  const xmlRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((cell, columnIndex) => cellXml(cell, columnIndex, rowNumber))
        .filter(Boolean)
        .join("");
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows}</sheetData></worksheet>`;
}

function cellXml(cell: CellValue, columnIndex: number, rowNumber: number): string {
  if (cell === null || cell === undefined || cell === "") {
    return "";
  }
  const ref = `${columnName(columnIndex)}${rowNumber}`;
  if (typeof cell === "number") {
    if (!Number.isFinite(cell)) {
      return "";
    }
    return `<c r="${ref}"><v>${cell}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`;
}

function columnName(index: number): string {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - remainder) / 26);
  }
  return name;
}

function contentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;
}

function rootRelationshipsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function workbookXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
<sheet name="Evalfuture" sheetId="1" r:id="rId1"/>
<sheet name="Amortization" sheetId="2" r:id="rId2"/>
</sheets>
</workbook>`;
}

function workbookRelationshipsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function zip(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder();
  const entries = Object.entries(files).map(([name, content]) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    return {
      nameBytes,
      data,
      crc: crc32(data),
      offset: 0
    };
  });

  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach((entry) => {
    entry.offset = offset;
    const localHeader = localFileHeader(entry);
    localParts.push(localHeader, entry.nameBytes, entry.data);
    offset += localHeader.length + entry.nameBytes.length + entry.data.length;
  });

  entries.forEach((entry) => {
    centralParts.push(centralDirectoryHeader(entry), entry.nameBytes);
  });

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = endOfCentralDirectory(entries.length, centralDirectorySize, centralDirectoryOffset);

  return concat([...localParts, ...centralParts, end]);
}

function localFileHeader(entry: {
  nameBytes: Uint8Array;
  data: Uint8Array;
  crc: number;
}): Uint8Array {
  const header = new Uint8Array(30);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, entry.crc, true);
  view.setUint32(18, entry.data.length, true);
  view.setUint32(22, entry.data.length, true);
  view.setUint16(26, entry.nameBytes.length, true);
  view.setUint16(28, 0, true);
  return header;
}

function centralDirectoryHeader(entry: {
  nameBytes: Uint8Array;
  data: Uint8Array;
  crc: number;
  offset: number;
}): Uint8Array {
  const header = new Uint8Array(46);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, entry.crc, true);
  view.setUint32(20, entry.data.length, true);
  view.setUint32(24, entry.data.length, true);
  view.setUint16(28, entry.nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, entry.offset, true);
  return header;
}

function endOfCentralDirectory(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number
): Uint8Array {
  const header = new Uint8Array(22);
  const view = new DataView(header.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);
  return header;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

let crcTable: Uint32Array | null = null;

function crc32(data: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  data.forEach((byte) => {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function getCrcTable(): Uint32Array {
  if (crcTable) {
    return crcTable;
  }
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  crcTable = table;
  return table;
}

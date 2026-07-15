import { EvaluationPreview } from "./model";

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
    "xl/styles.xml": stylesXml(preview.inputs.currencyCode),
    "xl/worksheets/sheet1.xml": sheetXml(buildEvalfutureRows(preview), "Evalfuture"),
    "xl/worksheets/sheet2.xml": sheetXml(buildAmortizationRows(preview), "amort")
  };

  return new Blob([zip(files)], { type: XLSX_MIME });
}

function buildEvalfutureRows(preview: EvaluationPreview): CellValue[][] {
  const { inputs, derived } = preview;
  const { currencyCode } = inputs;
  const rows: CellValue[][] = [
    ["Evalfuture. Property Evaluation Model"],
    [],
    ["Customer Details", "Value"],
    ["Customer name", inputs.customerName],
    ["Customer email", inputs.customerEmail],
    ["Customer phone", inputs.customerPhone],
    ["Customer notes / message", inputs.customerNotes || "Not provided"],
    [],
    ["Assumptions", "Value"],
    ["Property name / description", inputs.propertyName],
    ["Currency", currencyCode],
    ["Property Net Purchase Price", inputs.propertyNetPurchasePrice],
    ["Area value entered", inputs.areaValue],
    ["Area unit selected", inputs.areaUnit],
    ["Normalized area in sq. ft", inputs.areaSqFt],
    [`Down payment ${currencyCode}`, derived.downPaymentAmount],
    ["Down payment %", inputs.downPaymentPct],
    [`Purchase cost ${currencyCode}`, derived.purchaseCostAmount],
    ["Purchase cost %", inputs.purchaseCostPct],
    ["Loan payment period in years", inputs.loanTermYears],
    ["Mortgage rate %", inputs.mortgageRatePct],
    ["Early payment fee mode", inputs.earlyPaymentFeeSource === "amount" ? "Fixed amount/cap" : "Percentage of outstanding settlement balance"],
    [`Early payment fee ${currencyCode} amount/cap`, inputs.earlyPaymentFeeAmount],
    ["Early payment fee %", inputs.earlyPaymentFeePct],
    [`Current Rent of Property/year ${currencyCode}`, derived.currentRentPerYear],
    ["Current Rent of Property/year %", inputs.rentYieldPct],
    ["Service Charges Rate/per sq. ft/year", inputs.serviceChargePerSqFt],
    ["Service Charges/year", derived.serviceChargesYear],
    [`First-year expected savings earnings ${currencyCode}`, inputs.savingsProfitAmount],
    ["Profit rate your savings can earn per year", inputs.savingsProfitRatePct],
    ["Market scenario", inputs.scenario],
    ["Market variation mode", "In Custom mode, entered yearly values override defaults; blank rows use defaults."],
    [],
    ["Derived Values", currencyCode],
    ["Down payment amount", derived.downPaymentAmount],
    ["Purchase cost amount", derived.purchaseCostAmount],
    ["Current rent per year", derived.currentRentPerYear],
    ["Service Charges/year", derived.serviceChargesYear],
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
      "Chart-ready Market Data",
      "Variation",
      "Selling price",
      "Source"
    ],
    [
      "Year",
      "Market variation",
      "Selling price",
      "Source"
    ],
    [0, 0, inputs.propertyNetPurchasePrice, "Baseline"]
  ];

  preview.marketRows.forEach((row) => {
    rows.push([
      row.year,
      row.selectedMarketVariation,
      row.selectedSellingPrice,
      row.customMarketVariation === null ? "Default" : "Custom"
    ]);
  });

  rows.push(
    [],
    ["Rental vs Buying Comparison"],
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
      row.marketVariation,
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
    ""
  ]);

  const finalRow = preview.comparisonRows.at(-1);
  rows.push(
    [],
    ["Final Result", "Value"],
    [`Options comparison at Year ${finalRow?.year ?? 0}`, preview.finalOptionsComparison],
    [],
    ["Browser export note", "Chart objects are not embedded by the static browser exporter. The Year 0 market baseline and yearly chart-ready data above can be charted directly in Excel."]
  );

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
      row.interestPrincipalRatio,
      row.decrease,
      row.interestTotalInterestRatio
    ]);
  });

  return rows;
}

function sheetXml(rows: CellValue[][], sheetName: "Evalfuture" | "amort"): string {
  const xmlRows = rows
    .map((row, rowIndex) => {
      const rowNumber = rowIndex + 1;
      const cells = row
        .map((cell, columnIndex) =>
          cellXml(cell, columnIndex, rowNumber, styleForCell(rows, rowIndex, columnIndex, sheetName))
        )
        .filter(Boolean)
        .join("");
      return `<row r="${rowNumber}">${cells}</row>`;
    })
    .join("");

  const columns =
    sheetName === "Evalfuture"
      ? '<cols><col min="1" max="1" width="38" customWidth="1"/><col min="2" max="15" width="20" customWidth="1"/></cols>'
      : '<cols><col min="1" max="1" width="12" customWidth="1"/><col min="2" max="8" width="22" customWidth="1"/></cols>';
  const freezeRow = sheetName === "Evalfuture" ? 3 : 3;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="${freezeRow}" topLeftCell="A${freezeRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>${columns}<sheetData>${xmlRows}</sheetData>
<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
</worksheet>`;
}

function cellXml(
  cell: CellValue,
  columnIndex: number,
  rowNumber: number,
  style: number
): string {
  if (cell === null || cell === undefined || cell === "") {
    return "";
  }
  const ref = `${columnName(columnIndex)}${rowNumber}`;
  if (typeof cell === "number") {
    if (!Number.isFinite(cell)) {
      return "";
    }
    const rounded = style === 5 ? Math.round(cell * 100) / 100 : Math.round(cell * 1_000_000) / 1_000_000;
    return `<c r="${ref}" s="${style}"><v>${rounded}</v></c>`;
  }
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(cell)}</t></is></c>`;
}

function styleForCell(
  rows: CellValue[][],
  rowIndex: number,
  columnIndex: number,
  sheetName: "Evalfuture" | "amort"
): number {
  const row = rows[rowIndex];
  const first = row[0];
  if (rowIndex === 0) return 1;
  if (
    typeof first === "string" &&
    ["Customer Details", "Assumptions", "Derived Values", "Chart-ready Market Data", "Rental vs Buying Comparison", "Final Result"].includes(first)
  ) return 2;
  if (first === "Year") return 3;
  if (first === "Total") return 8;
  if (first === "Browser export note") return columnIndex === 0 ? 4 : 9;
  if (columnIndex === 0) return 4;

  const previousHeader = [...rows.slice(0, rowIndex)]
    .reverse()
    .find((candidate) => candidate[0] === "Year");
  if (previousHeader) {
    if (sheetName === "amort") {
      if (columnIndex === 5 || columnIndex === 7) return 6;
      return columnIndex === 0 ? 7 : 5;
    }
    if (previousHeader.length === 4) {
      if (columnIndex === 1) return 6;
      if (columnIndex === 2) return 5;
      return columnIndex === 0 ? 7 : 0;
    }
    if (previousHeader.length === 15) {
      if (columnIndex === 11) return 6;
      return columnIndex === 0 ? 7 : 5;
    }
  }

  if (typeof first === "string") {
    if (first.includes("%") || first === "Profit rate your savings can earn per year") return 6;
    if (first.includes("years")) return 7;
    if (
      first.includes("price") || first.includes("amount") || first.includes("cost") ||
      first.includes("payment") || first.includes("rent") || first.includes("Rent") ||
      first.includes("instalment") || first.includes("Interest") || first.includes("earnings") ||
      first.includes("charges") || first.includes("Charges") || first.includes("loan") ||
      first.includes("funds") || first.includes("comparison")
    ) return 5;
  }
  return 0;
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
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
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
<sheet name="amort" sheetId="2" r:id="rId2"/>
</sheets>
</workbook>`;
}

function workbookRelationshipsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function stylesXml(currencyCode: string): string {
  const currencyFormat = `&quot;${escapeXml(currencyCode)}&quot; #,##0;[Red]-&quot;${escapeXml(currencyCode)}&quot; #,##0`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="${currencyFormat}"/><numFmt numFmtId="165" formatCode="0.00%"/></numFmts>
<fonts count="4">
<font><sz val="10"/><name val="Aptos"/><color rgb="FF334155"/></font>
<font><b/><sz val="18"/><name val="Aptos Display"/><color rgb="FF0B1F33"/></font>
<font><b/><sz val="10"/><name val="Aptos"/><color rgb="FFFFFFFF"/></font>
<font><i/><sz val="9"/><name val="Aptos"/><color rgb="FF334155"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF8FAF6"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0B1F33"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD4AF37"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="2" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="5" borderId="1" xfId="0" applyNumberFormat="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
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

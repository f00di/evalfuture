from __future__ import annotations

from io import BytesIO

import xlsxwriter
from xlsxwriter.utility import xl_range_abs, xl_rowcol_to_cell

from .calculations import calculate_preview
from .schemas import EvaluationPreview, EvaluationRequest


def _currency(value: float) -> float:
    return round(value, 2)


def generate_workbook(inputs: EvaluationRequest) -> bytes:
    preview = calculate_preview(inputs)
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output, {"in_memory": True})
    workbook.set_calc_mode("auto")

    formats = _build_formats(workbook)
    eval_ws = workbook.add_worksheet("Evalfuture")
    amort_ws = workbook.add_worksheet("amort")

    _write_evalfuture_sheet(workbook, eval_ws, preview, formats)
    _write_amort_sheet(amort_ws, preview, formats)

    workbook.close()
    output.seek(0)
    return output.getvalue()


def _build_formats(workbook: xlsxwriter.Workbook) -> dict[str, xlsxwriter.format.Format]:
    navy = "#0B1F33"
    slate = "#334155"
    teal = "#0F766E"
    gold = "#D4AF37"
    cream = "#F8FAF6"
    blue_gray = "#E7F0F7"
    amber = "#FEF3C7"
    red = "#B91C1C"
    green = "#047857"
    border = "#CBD5E1"

    base = {
        "font_name": "Aptos",
        "font_size": 10,
        "border": 1,
        "border_color": border,
        "valign": "vcenter",
    }

    return {
        "title": workbook.add_format(
            {
                "font_name": "Aptos Display",
                "font_size": 18,
                "bold": True,
                "font_color": navy,
                "bg_color": cream,
                "valign": "vcenter",
            }
        ),
        "label": workbook.add_format({**base, "font_color": slate, "bg_color": cream}),
        "input": workbook.add_format(
            {**base, "bg_color": amber, "font_color": navy, "num_format": '#,##0.00'}
        ),
        "input_int": workbook.add_format(
            {**base, "bg_color": amber, "font_color": navy, "num_format": "0"}
        ),
        "input_pct": workbook.add_format(
            {**base, "bg_color": amber, "font_color": navy, "num_format": "0.00%"}
        ),
        "formula": workbook.add_format(
            {**base, "bg_color": "#FFFFFF", "font_color": navy, "num_format": '#,##0.00'}
        ),
        "formula_pct": workbook.add_format(
            {**base, "bg_color": "#FFFFFF", "font_color": navy, "num_format": "0.00%"}
        ),
        "section": workbook.add_format(
            {
                **base,
                "bold": True,
                "font_color": "#FFFFFF",
                "bg_color": teal,
                "align": "center",
            }
        ),
        "navy_header": workbook.add_format(
            {
                **base,
                "bold": True,
                "font_color": "#FFFFFF",
                "bg_color": navy,
                "align": "center",
            }
        ),
        "group_header": workbook.add_format(
            {
                **base,
                "bold": True,
                "font_color": navy,
                "bg_color": blue_gray,
                "align": "center",
            }
        ),
        "year": workbook.add_format({**base, "align": "center", "num_format": "0"}),
        "currency": workbook.add_format({**base, "num_format": '#,##0.00'}),
        "pct": workbook.add_format({**base, "num_format": "0.00%"}),
        "money_pos": workbook.add_format(
            {**base, "font_color": green, "num_format": '#,##0.00'}
        ),
        "money_neg": workbook.add_format(
            {**base, "font_color": red, "num_format": '#,##0.00'}
        ),
        "note": workbook.add_format(
            {"font_name": "Aptos", "font_size": 9, "font_color": slate, "italic": True}
        ),
        "blank_gray": workbook.add_format(
            {**base, "bg_color": "#E5E7EB", "font_color": "#6B7280"}
        ),
        "total": workbook.add_format(
            {
                **base,
                "bold": True,
                "font_color": navy,
                "bg_color": gold,
                "num_format": '#,##0.00',
            }
        ),
    }


def _write_evalfuture_sheet(
    workbook: xlsxwriter.Workbook,
    ws: xlsxwriter.worksheet.Worksheet,
    preview: EvaluationPreview,
    fmt: dict[str, xlsxwriter.format.Format],
) -> None:
    inputs = preview.inputs
    derived = preview.derived
    ws.hide_gridlines(2)
    ws.freeze_panes(22, 0)
    ws.set_zoom(90)
    ws.set_column("A:A", 45)
    ws.set_column("B:C", 18)
    ws.set_column("D:D", 4)
    ws.set_column("E:G", 18)
    ws.set_column("H:H", 22)
    ws.set_column("I:O", 18)

    labels = [
        "Property Net Purchase Price",
        "Area in sq. ft",
        "Down payment",
        "Purchase cost",
        "Loan payment period in years (1 to 40 years)",
        "Mortgage rate",
        "Early Payment Fee",
        "Current Rent of Property/year",
        "Service Charges Rate/per sq. ft/year",
        "Profit rate which your savings can earn for you/year",
        "Total initial funds required (down payment + purchase cost)",
        "Principal Loan",
        "Bank monthly instalment",
        "Bank yearly instalment",
        "Total bank payment",
        "Total Interest",
        "Service Charges/year",
        "Service Charges/month",
        "Net Rental/year",
        "Total Cost",
    ]
    for row, label in enumerate(labels):
        ws.write(row, 0, label, fmt["label"])

    ws.write("H1", inputs.propertyName, fmt["title"])
    ws.write_number("F1", inputs.propertyNetPurchasePrice, fmt["input"])
    ws.write_number("F2", inputs.areaSqFt, fmt["input"])
    ws.write_number("F3", inputs.downPaymentPct, fmt["input_pct"])
    ws.write_number("F4", inputs.purchaseCostPct, fmt["input_pct"])
    ws.write_number("F5", inputs.loanTermYears, fmt["input_int"])
    ws.write_number("F6", inputs.mortgageRatePct, fmt["input_pct"])
    ws.write_number("F7", inputs.earlyPaymentFeePct, fmt["input_pct"])
    ws.write_number("F8", inputs.rentYieldPct, fmt["input_pct"])
    ws.write_number("F9", inputs.serviceChargePerSqFt, fmt["input"])
    ws.write_number("F10", inputs.savingsProfitRatePct, fmt["input_pct"])

    formulas = {
        "G3": ("=F1*F3", derived.downPaymentAmount, "formula"),
        "G4": ("=F1*F4", derived.purchaseCostAmount, "formula"),
        "G8": ("=F8*F1", derived.currentRentPerYear, "formula"),
        "G9": ("=F9*F2", derived.serviceChargesYear, "formula"),
        "G11": ("=G3+G4", derived.totalInitialFundsRequired, "formula"),
        "G12": ("=F1-G3", derived.principalLoan, "formula"),
        "G13": ("=-amort!B8/12", derived.monthlyBankInstalment, "formula"),
        "G14": ("=G13*12", derived.yearlyBankInstalment, "formula"),
        "G15": ("=G13*F5*12", derived.totalBankPayment, "formula"),
        "G16": ("=G15-G12", derived.totalInterest, "formula"),
        "F16": ("=G16/G12", derived.totalInterestPct, "formula_pct"),
        "G17": ("=F2*F9", derived.serviceChargesYear, "formula"),
        "G18": ("=G17/12", derived.serviceChargesMonth, "formula"),
        "G19": ("=G8-G17", derived.netRentalYear, "formula"),
        "G20": ("=F1+G4+G16", derived.totalCost, "formula"),
    }
    for cell, (formula, value, format_key) in formulas.items():
        ws.write_formula(cell, formula, fmt[format_key], value)

    _write_market_tables(workbook, ws, preview, fmt)
    _write_comparison_table(ws, preview, fmt)
    _write_amortization_summary(ws, preview, fmt)


def _write_market_tables(
    workbook: xlsxwriter.Workbook,
    ws: xlsxwriter.worksheet.Worksheet,
    preview: EvaluationPreview,
    fmt: dict[str, xlsxwriter.format.Format],
) -> None:
    loan_term = preview.inputs.loanTermYears
    market_start_row = 22
    header_row = 23
    data_start = 24
    last_data_row = data_start + loan_term - 1

    ws.merge_range(market_start_row, 0, market_start_row, 2, "Default Market Variation", fmt["section"])
    ws.merge_range(market_start_row, 4, market_start_row, 6, "Custom Market Variation", fmt["section"])
    ws.write(market_start_row, 7, "Selected Scenario", fmt["section"])
    ws.write(header_row, 0, "Year", fmt["navy_header"])
    ws.write(header_row, 1, "Market Variation", fmt["navy_header"])
    ws.write(header_row, 2, "Selling Price", fmt["navy_header"])
    ws.write(header_row, 4, "Year", fmt["navy_header"])
    ws.write(header_row, 5, "Custom Market Variation", fmt["navy_header"])
    ws.write(header_row, 6, "Custom Selling Price", fmt["navy_header"])
    ws.write(header_row, 7, preview.inputs.scenario, fmt["input"])
    ws.data_validation(
        header_row,
        7,
        header_row,
        7,
        {"validate": "list", "source": ["Default", "Custom"]},
    )

    for index, market in enumerate(preview.marketRows):
        row = data_start + index
        excel_row = row + 1
        ws.write_number(row, 0, market.year, fmt["year"])
        if index < 2:
            default_formula = "=0"
        else:
            previous_cell = xl_rowcol_to_cell(row - 1, 1)
            default_formula = f"={previous_cell}-2%"
        ws.write_formula(row, 1, default_formula, fmt["input_pct"], market.defaultMarketVariation)
        ws.write_formula(
            row,
            2,
            f"=$F$1*(1+B{excel_row})",
            fmt["currency"],
            _currency(market.defaultSellingPrice),
        )
        ws.write_number(row, 4, market.year, fmt["year"])
        if market.customMarketVariation is None:
            ws.write_blank(row, 5, None, fmt["input_pct"])
            custom_price_value = ""
        else:
            ws.write_number(row, 5, market.customMarketVariation, fmt["input_pct"])
            custom_price_value = _currency(market.customSellingPrice or 0)
        ws.write_formula(
            row,
            6,
            f'=IF(F{excel_row}="","",$F$1*(1+F{excel_row}))',
            fmt["currency"],
            custom_price_value,
        )

    chart = workbook.add_chart({"type": "line"})
    categories = f"=Evalfuture!{xl_range_abs(data_start, 0, last_data_row, 0)}"
    chart.add_series(
        {
            "name": "Default Market Variation",
            "categories": categories,
            "values": f"=Evalfuture!{xl_range_abs(data_start, 1, last_data_row, 1)}",
            "line": {"color": "#0F766E", "width": 2.25},
        }
    )
    chart.add_series(
        {
            "name": "Custom Market Variation",
            "categories": categories,
            "values": f"=Evalfuture!{xl_range_abs(data_start, 5, last_data_row, 5)}",
            "line": {"color": "#D4AF37", "width": 2.25},
        }
    )
    chart.set_title({"name": "Property Market Price Fluctuations"})
    chart.set_x_axis({"name": "Years"})
    chart.set_y_axis({"name": "% change from current price", "num_format": "0%"})
    chart.set_legend({"position": "bottom"})
    chart.set_size({"width": 700, "height": 330})
    ws.insert_chart("I3", chart)


def _comparison_layout(preview: EvaluationPreview) -> tuple[int, int, int, int]:
    market_end = 24 + preview.inputs.loanTermYears
    comparison_start = max(market_end + 4, 66)
    group_row = comparison_start - 1
    header_row = comparison_start
    data_start = comparison_start + 1
    total_row = data_start + preview.inputs.loanTermYears
    return group_row, header_row, data_start, total_row


def _write_comparison_table(
    ws: xlsxwriter.worksheet.Worksheet,
    preview: EvaluationPreview,
    fmt: dict[str, xlsxwriter.format.Format],
) -> None:
    group_row, header_row, data_start, total_row = _comparison_layout(preview)
    headers = [
        "Year",
        "Rent",
        "Funds Available",
        "Earning on Available Funds",
        "Net Total",
        "Bank Instalments - Yearly",
        "Bank Instalments - Interest",
        "Bank Instalments - Principal",
        "Total Principal",
        "Total Cost",
        "Early Settlement Cost",
        "Market Variation",
        "Property Market Price",
        "Net Total / Resale",
        "Options Comparison",
    ]
    ws.write(group_row, 0, "Year", fmt["group_header"])
    ws.merge_range(group_row, 1, group_row, 4, "Rental Option", fmt["group_header"])
    ws.merge_range(group_row, 5, group_row, 13, "Buying Option", fmt["group_header"])
    ws.write(group_row, 14, "Options Comparison", fmt["group_header"])
    for col, header in enumerate(headers):
        ws.write(header_row, col, header, fmt["navy_header"])

    for index, row_model in enumerate(preview.comparisonRows):
        row = data_start + index
        excel_row = row + 1
        variation_row = 25 + index
        amort_row = 8 + index
        if index == 0:
            formulas = [
                ("=1", row_model.year, "year"),
                (f"=G$8*(1+L{excel_row})", row_model.rent, "currency"),
                ("=G$3+G$4", row_model.fundsAvailable, "currency"),
                (f"=C{excel_row}*$F$10", row_model.earningOnAvailableFunds, "currency"),
                (f"=D{excel_row}", row_model.rentalNetTotal, "currency"),
                (f"=G{excel_row}+H{excel_row}", row_model.yearlyBankInstalments, "currency"),
                (f'=-IF(amort!C{amort_row}="",0,amort!C{amort_row})', row_model.bankInterest, "currency"),
                (f'=-IF(amort!D{amort_row}="",0,amort!D{amort_row})', row_model.bankPrincipal, "currency"),
                (f"=H{excel_row}", row_model.totalPrincipal, "currency"),
                (f"=F{excel_row}+G$17", row_model.totalCost, "currency"),
                (
                    f"=IF((G$12-I{excel_row})*F$7>10000,10000,(G$12-I{excel_row})*F$7)",
                    row_model.earlySettlementCost,
                    "currency",
                ),
                (
                    f'=IF(AND($H$24="Custom",F{variation_row}<>""),F{variation_row},B{variation_row})',
                    row_model.marketVariation,
                    "pct",
                ),
                (f"=F$1*(L{excel_row}+1)", row_model.propertyMarketPrice, "currency"),
                (
                    f"=(G$3+I{excel_row})*(1+L{excel_row})-K{excel_row}",
                    row_model.netTotalResale,
                    "currency",
                ),
                (
                    f"=N{excel_row}-E{excel_row}-G$4",
                    row_model.optionsComparison,
                    "currency",
                ),
            ]
        else:
            prev_row = excel_row - 1
            formulas = [
                (f"=A{prev_row}+1", row_model.year, "year"),
                (f"=G$8*(1+L{excel_row})", row_model.rent, "currency"),
                (
                    f"=E{prev_row}+J{prev_row}-B{excel_row}",
                    row_model.fundsAvailable,
                    "currency",
                ),
                (f"=C{excel_row}*$F$10", row_model.earningOnAvailableFunds, "currency"),
                (
                    f"=E{prev_row}+D{excel_row}",
                    row_model.rentalNetTotal,
                    "currency",
                ),
                (f"=G{excel_row}+H{excel_row}", row_model.yearlyBankInstalments, "currency"),
                (f'=-IF(amort!C{amort_row}="",0,amort!C{amort_row})', row_model.bankInterest, "currency"),
                (f'=-IF(amort!D{amort_row}="",0,amort!D{amort_row})', row_model.bankPrincipal, "currency"),
                (f"=I{prev_row}+H{excel_row}", row_model.totalPrincipal, "currency"),
                (f"=F{excel_row}+G$17", row_model.totalCost, "currency"),
                (
                    f"=IF((G$12-I{excel_row})*F$7>10000,10000,(G$12-I{excel_row})*F$7)",
                    row_model.earlySettlementCost,
                    "currency",
                ),
                (
                    f'=IF(AND($H$24="Custom",F{variation_row}<>""),F{variation_row},B{variation_row})',
                    row_model.marketVariation,
                    "pct",
                ),
                (f"=F$1*(L{excel_row}+1)", row_model.propertyMarketPrice, "currency"),
                (
                    f"=(G$3+I{excel_row})*(1+L{excel_row})-K{excel_row}",
                    row_model.netTotalResale,
                    "currency",
                ),
                (
                    f"=N{excel_row}-E{excel_row}-G$4",
                    row_model.optionsComparison,
                    "currency",
                ),
            ]

        for col, (formula, value, format_key) in enumerate(formulas):
            ws.write_formula(row, col, formula, fmt[format_key], _currency(value) if isinstance(value, float) else value)

    total_excel_row = total_row + 1
    first_data_excel = data_start + 1
    last_data_excel = total_row
    ws.write(total_row, 0, "Total", fmt["total"])
    for col in range(1, 15):
        if col in [5, 6, 7]:
            letter = chr(ord("A") + col)
            ws.write_formula(
                total_row,
                col,
                f"=SUM({letter}{first_data_excel}:{letter}{last_data_excel})",
                fmt["total"],
                _currency(
                    {
                        5: preview.totals.yearlyBankInstalments,
                        6: preview.totals.bankInterest,
                        7: preview.totals.bankPrincipal,
                    }[col]
                ),
            )
        else:
            ws.write_blank(total_row, col, None, fmt["total"])
    ws.set_row(total_row, 22)
    ws.conditional_format(
        data_start,
        14,
        total_row - 1,
        14,
        {
            "type": "cell",
            "criteria": "<",
            "value": 0,
            "format": fmt["money_neg"],
        },
    )
    ws.conditional_format(
        data_start,
        14,
        total_row - 1,
        14,
        {
            "type": "cell",
            "criteria": ">=",
            "value": 0,
            "format": fmt["money_pos"],
        },
    )
    # Keep the variable for formula audits and to make the row math explicit.
    _ = total_excel_row


def _write_amortization_summary(
    ws: xlsxwriter.worksheet.Worksheet,
    preview: EvaluationPreview,
    fmt: dict[str, xlsxwriter.format.Format],
) -> None:
    _, _, comparison_data_start, comparison_total_row = _comparison_layout(preview)
    summary_start = comparison_total_row + 4
    header_row = summary_start + 1
    data_start = summary_start + 2

    ws.merge_range(
        summary_start,
        0,
        summary_start,
        7,
        "Amortization Calculator",
        fmt["section"],
    )
    headers = [
        "Year",
        "Interest",
        "Principal",
        "Ending Balance",
        "Total Instalment",
        "Interest / principal ratio",
        "Decrease",
        "Interest / total interest",
    ]
    for col, header in enumerate(headers):
        ws.write(header_row, col, header, fmt["navy_header"])

    for index, row_model in enumerate(preview.amortizationSummaryRows):
        row = data_start + index
        excel_row = row + 1
        comparison_row = comparison_data_start + index + 1
        first_summary_row = data_start + 1
        formulas = [
            (f"=A{comparison_row}", row_model.year, "year"),
            (f"=G{comparison_row}", row_model.interest, "currency"),
            (f"=H{comparison_row}", row_model.principal, "currency"),
            (
                f"=MAX(0,$G$12-SUM($C${first_summary_row}:C{excel_row}))",
                row_model.endingBalance,
                "currency",
            ),
            (f"=B{excel_row}+C{excel_row}", row_model.totalInstalment, "currency"),
            (
                f"=IF(C{excel_row}=0,0,B{excel_row}/C{excel_row})",
                row_model.interestPrincipalRatio,
                "pct",
            ),
            (f"=C{excel_row}", row_model.decrease, "currency"),
            (
                f"=IF($G$16=0,0,B{excel_row}/$G$16)",
                row_model.interestTotalInterestRatio,
                "pct",
            ),
        ]
        for col, (formula, value, format_key) in enumerate(formulas):
            ws.write_formula(row, col, formula, fmt[format_key], _currency(value) if isinstance(value, float) else value)

    note_row = data_start + preview.inputs.loanTermYears + 2
    ws.write(note_row, 0, "Reference:", fmt["note"])
    ws.write_url(note_row, 1, "https://mymortgage.ae/calculator", fmt["note"], "https://mymortgage.ae/calculator")


def _write_amort_sheet(
    ws: xlsxwriter.worksheet.Worksheet,
    preview: EvaluationPreview,
    fmt: dict[str, xlsxwriter.format.Format],
) -> None:
    inputs = preview.inputs
    ws.hide_gridlines(2)
    ws.freeze_panes(7, 0)
    ws.set_zoom(95)
    ws.set_column("A:A", 18)
    ws.set_column("B:E", 18)
    ws.set_column("F:F", 18)

    ws.write("A1", "Input cells", fmt["section"])
    ws.write("E1", "Loan summary", fmt["section"])
    labels = [
        ("A2", "Annual interest rate"),
        ("A3", "Loan term (in years)"),
        ("A4", "Payments per year"),
        ("A5", "Loan amount"),
        ("E2", "Total payments"),
        ("E3", "Total interest"),
    ]
    for cell, label in labels:
        ws.write(cell, label, fmt["label"])

    ws.write_formula("C2", "=Evalfuture!F6", fmt["input_pct"], inputs.mortgageRatePct)
    ws.write_formula("C3", "=Evalfuture!F5", fmt["input_int"], inputs.loanTermYears)
    ws.write_number("C4", 1, fmt["input_int"])
    ws.write_formula("C5", "=Evalfuture!G12", fmt["currency"], preview.derived.principalLoan)
    ws.write_formula("F2", "=-SUM(B8:B367)", fmt["currency"], preview.derived.totalBankPayment)
    ws.write_formula("F3", "=-SUM(C8:C367)", fmt["currency"], preview.derived.totalInterest)

    headers = ["Period", "Payment", "Interest", "Principal", "Balance"]
    for col, header in enumerate(headers):
        ws.write(6, col, header, fmt["navy_header"])

    schedule_by_period = {row.period: row for row in preview.amortizationRows}
    for row_index in range(7, 367):
        excel_row = row_index + 1
        period = row_index - 6
        period_row = schedule_by_period.get(period)
        active = period <= inputs.loanTermYears
        values = period_row if period_row and active else None
        if row_index == 7:
            balance_formula = "=C5+D8"
        else:
            balance_formula = f'=IF(A{excel_row}<=$C$3*$C$4,E{excel_row-1}+D{excel_row},"")'

        formulas = [
            (f"=A{excel_row - 1}+1" if row_index > 7 else "=1", period, "year"),
            (
                f'=IF(A{excel_row}<=$C$3*$C$4,PMT($C$2/$C$4,$C$3*$C$4,$C$5),"")',
                values.payment if values else "",
                "currency",
            ),
            (
                f'=IF(A{excel_row}<=$C$3*$C$4,IPMT($C$2/$C$4,A{excel_row},$C$3*$C$4,$C$5),"")',
                values.interest if values else "",
                "currency",
            ),
            (
                f'=IF(A{excel_row}<=$C$3*$C$4,PPMT($C$2/$C$4,A{excel_row},$C$3*$C$4,$C$5),"")',
                values.principal if values else "",
                "currency",
            ),
            (
                balance_formula,
                values.balance if values else "",
                "currency",
            ),
        ]
        for col, (formula, value, format_key) in enumerate(formulas):
            ws.write_formula(row_index, col, formula, fmt[format_key], value)

    ws.conditional_format(
        7,
        0,
        366,
        4,
        {
            "type": "formula",
            "criteria": "=$A8>$C$3*$C$4",
            "format": fmt["blank_gray"],
        },
    )

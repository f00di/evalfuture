from __future__ import annotations

import zipfile
from io import BytesIO
from xml.etree import ElementTree

from app.schemas import EvaluationRequest
from app.xlsx_generator import generate_workbook


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "chart": "http://schemas.openxmlformats.org/drawingml/2006/chart",
}


def _xml_from_zip(workbook_bytes: bytes, name: str) -> ElementTree.Element:
    with zipfile.ZipFile(BytesIO(workbook_bytes)) as archive:
        return ElementTree.fromstring(archive.read(name))


def test_workbook_has_exactly_two_visible_sheets() -> None:
    workbook = generate_workbook(EvaluationRequest())
    root = _xml_from_zip(workbook, "xl/workbook.xml")
    sheets = root.find("main:sheets", NS)
    assert sheets is not None
    sheet_nodes = list(sheets)
    assert [sheet.attrib["name"] for sheet in sheet_nodes] == ["Evalfuture", "amort"]
    assert all(sheet.attrib.get("state", "visible") == "visible" for sheet in sheet_nodes)


def test_loan_term_10_chart_includes_year_zero_and_10_market_points() -> None:
    workbook = generate_workbook(EvaluationRequest(loanTermYears=10))
    chart_root = _xml_from_zip(workbook, "xl/charts/chart1.xml")
    formulas = [node.text for node in chart_root.findall(".//chart:f", NS)]

    assert "Evalfuture!$Q$2:$Q$12" in formulas
    assert "Evalfuture!$S$2:$S$12" in formulas
    assert all("$Q$2:$Q$42" not in formula for formula in formulas if formula)


def test_loan_term_25_chart_includes_year_zero_and_25_market_points() -> None:
    workbook = generate_workbook(EvaluationRequest(loanTermYears=25))
    chart_root = _xml_from_zip(workbook, "xl/charts/chart1.xml")
    formulas = [node.text for node in chart_root.findall(".//chart:f", NS)]

    assert "Evalfuture!$Q$2:$Q$27" in formulas
    assert "Evalfuture!$S$2:$S$27" in formulas


def test_chart_year_zero_is_not_added_to_amortization_rows() -> None:
    workbook = generate_workbook(EvaluationRequest(loanTermYears=10))
    amort_root = _xml_from_zip(workbook, "xl/worksheets/sheet2.xml")
    formulas = [node.text or "" for node in amort_root.findall(".//main:f", NS)]

    assert any(formula == "1" for formula in formulas)
    assert all(formula != "0" for formula in formulas)


def test_loan_term_10_has_no_visible_40_row_market_table_cells() -> None:
    workbook = generate_workbook(EvaluationRequest(loanTermYears=10))
    sheet_root = _xml_from_zip(workbook, "xl/worksheets/sheet1.xml")
    cells = {
        cell.attrib["r"]
        for cell in sheet_root.findall(".//main:c", NS)
        if cell.attrib["r"].startswith(("A", "B", "C", "E", "F", "G"))
    }

    assert "A34" in cells
    assert "C34" in cells
    assert "E34" in cells
    assert "G34" in cells
    assert "A35" not in cells
    assert "C64" not in cells


def test_workbook_settlement_formula_uses_current_mode_without_hardcoded_cap() -> None:
    workbook = generate_workbook(
        EvaluationRequest(
            earlyPaymentFeeSource="amount",
            earlyPaymentFeeAmount=12_345,
            earlyPaymentFeePct=0.05,
        )
    )
    sheet_root = _xml_from_zip(workbook, "xl/worksheets/sheet1.xml")
    formulas = [node.text or "" for node in sheet_root.findall(".//main:f", NS)]
    settlement_formulas = [formula for formula in formulas if "$H$7" in formula]

    assert settlement_formulas
    assert all("10000" not in formula for formula in settlement_formulas)
    assert all("$G$7" in formula and "$F$7" in formula for formula in settlement_formulas)

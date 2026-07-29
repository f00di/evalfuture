from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.calculations import calculate_preview
from app.schemas import EvaluationRequest


SHARED_VECTORS = json.loads(
    (
        Path(__file__).resolve().parents[2]
        / "shared"
        / "calculation-vectors.json"
    ).read_text()
)


@pytest.mark.parametrize(
    ("vector"),
    SHARED_VECTORS,
    ids=[vector["name"] for vector in SHARED_VECTORS],
)
def test_shared_frontend_backend_vectors(vector: dict) -> None:
    preview = calculate_preview(EvaluationRequest(**vector["inputs"]))
    expected = vector["expected"]
    first = preview.comparisonRows[0]
    final = preview.comparisonRows[-1]

    assert len(preview.marketRows) == expected["rowCount"]
    assert len(preview.comparisonRows) == expected["rowCount"]
    assert preview.derived.downPaymentAmount == pytest.approx(expected["downPaymentAmount"])
    assert preview.derived.purchaseCostAmount == pytest.approx(expected["purchaseCostAmount"])
    assert preview.derived.currentRentPerYear == pytest.approx(expected["currentRentPerYear"])
    assert preview.derived.serviceChargesYear == pytest.approx(expected["serviceChargesYear"])
    assert preview.derived.principalLoan == pytest.approx(expected["principalLoan"])
    assert preview.derived.monthlyBankInstalment == pytest.approx(
        expected["monthlyBankInstalment"]
    )
    assert preview.derived.totalInterest == pytest.approx(expected["totalInterest"])
    assert preview.marketRows[0].selectedMarketVariation == pytest.approx(
        expected["firstSelectedVariation"]
    )
    assert preview.marketRows[-1].selectedMarketVariation == pytest.approx(
        expected["finalSelectedVariation"]
    )
    assert first.earlySettlementCost == pytest.approx(
        expected["firstEarlySettlementCost"]
    )
    assert final.netTotalResale == pytest.approx(expected["finalResale"])
    assert preview.finalOptionsComparison == pytest.approx(
        expected["finalOptionsComparison"]
    )


def test_default_preview_matches_expected_values() -> None:
    preview = calculate_preview(EvaluationRequest())

    assert preview.derived.downPaymentAmount == pytest.approx(300_000, abs=0.01)
    assert preview.derived.purchaseCostAmount == pytest.approx(75_000, abs=0.01)
    assert preview.derived.principalLoan == pytest.approx(1_200_000, abs=0.01)
    assert preview.derived.monthlyBankInstalment == pytest.approx(12_145.66, abs=0.02)
    assert preview.derived.yearlyBankInstalment == pytest.approx(145_747.89, abs=0.02)
    assert preview.derived.totalBankPayment == pytest.approx(1_457_478.91, abs=0.05)
    assert preview.derived.totalInterest == pytest.approx(257_478.91, abs=0.05)
    assert preview.derived.serviceChargesYear == pytest.approx(15_600, abs=0.01)
    assert preview.derived.netRentalYear == pytest.approx(96_900, abs=0.01)
    assert preview.derived.totalCost == pytest.approx(1_832_478.91, abs=0.05)


def test_loan_term_controls_market_and_comparison_rows() -> None:
    preview_10 = calculate_preview(EvaluationRequest(loanTermYears=10))
    preview_25 = calculate_preview(EvaluationRequest(loanTermYears=25))

    assert len(preview_10.marketRows) == 10
    assert len(preview_10.comparisonRows) == 10
    assert preview_10.marketRows[-1].defaultMarketVariation == pytest.approx(-0.16)

    assert len(preview_25.marketRows) == 25
    assert len(preview_25.comparisonRows) == 25
    assert preview_25.marketRows[-1].defaultMarketVariation == pytest.approx(-0.46)


def test_custom_scenario_overrides_selected_market_variation() -> None:
    custom = [0.01, 0.02, -0.01]
    preview = calculate_preview(
        EvaluationRequest(
            loanTermYears=3,
            scenario="Custom",
            customMarketVariations=custom,
        )
    )

    assert [row.selectedMarketVariation for row in preview.marketRows] == custom
    assert preview.comparisonRows[2].marketVariation == pytest.approx(-0.01)


def test_blank_custom_value_falls_back_and_zero_override_is_preserved() -> None:
    preview = calculate_preview(
        EvaluationRequest(
            loanTermYears=3,
            scenario="Custom",
            customMarketVariations=[None, -0.05, 0],
        )
    )

    assert [row.selectedMarketVariation for row in preview.marketRows] == [
        0,
        -0.05,
        0,
    ]


def test_custom_variation_length_must_match_loan_term() -> None:
    with pytest.raises(ValueError, match="custom market variation rows must match loan term"):
        calculate_preview(
            EvaluationRequest(
                loanTermYears=10,
                customMarketVariations=[0.0, 0.01],
            )
        )


def test_early_payment_percentage_is_applied_to_outstanding_balance() -> None:
    preview = calculate_preview(
        EvaluationRequest(
            earlyPaymentFeeSource="percent",
            earlyPaymentFeePct=0.05,
            earlyPaymentFeeAmount=1,
        )
    )

    first = preview.comparisonRows[0]
    outstanding = preview.derived.principalLoan - first.totalPrincipal
    assert first.earlySettlementCost == pytest.approx(outstanding * 0.05)
    assert first.earlySettlementCost > 10_000


def test_early_payment_amount_uses_entered_fee_capped_by_balance() -> None:
    preview = calculate_preview(
        EvaluationRequest(
            earlyPaymentFeeSource="amount",
            earlyPaymentFeeAmount=12_345,
            earlyPaymentFeePct=0.75,
        )
    )

    assert preview.comparisonRows[0].earlySettlementCost == pytest.approx(12_345)
    assert preview.comparisonRows[-1].earlySettlementCost == pytest.approx(0)


def test_totals_and_final_values_match_displayed_rows() -> None:
    preview = calculate_preview(EvaluationRequest())
    rows = preview.comparisonRows

    assert preview.totals.yearlyBankInstalments == pytest.approx(
        sum(row.yearlyBankInstalments for row in rows)
    )
    assert preview.totals.bankInterest == pytest.approx(sum(row.bankInterest for row in rows))
    assert preview.totals.bankPrincipal == pytest.approx(sum(row.bankPrincipal for row in rows))
    assert preview.finalOptionsComparison == pytest.approx(rows[-1].optionsComparison)

    for index, row in enumerate(rows):
        expected_rental_total = row.earningOnAvailableFunds
        if index > 0:
            expected_rental_total += rows[index - 1].rentalNetTotal
        assert row.rentalNetTotal == pytest.approx(expected_rental_total)
        outstanding = max(0, preview.derived.principalLoan - row.totalPrincipal)
        expected_resale = row.propertyMarketPrice - outstanding - row.earlySettlementCost
        assert row.netTotalResale == pytest.approx(expected_resale)
        assert row.optionsComparison == pytest.approx(
            row.netTotalResale - row.rentalNetTotal - preview.derived.purchaseCostAmount
        )


@pytest.mark.parametrize(
    "overrides",
    [
        {"propertyNetPurchasePrice": float("nan")},
        {"currentRentPerYear": float("inf")},
        {"purchaseCostSource": "amount", "purchaseCostAmount": -1},
        {"propertyNetPurchasePrice": 1_000_000_000_001},
        {"loanTermYears": 0},
        {"mortgageRatePct": 1.01},
    ],
)
def test_invalid_numerical_inputs_are_rejected(overrides: dict) -> None:
    with pytest.raises(ValidationError):
        EvaluationRequest(**overrides)

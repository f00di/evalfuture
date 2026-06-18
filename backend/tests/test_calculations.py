from __future__ import annotations

import pytest

from app.calculations import calculate_preview
from app.schemas import EvaluationRequest


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


def test_custom_variation_length_must_match_loan_term() -> None:
    with pytest.raises(ValueError, match="custom market variation rows must match loan term"):
        calculate_preview(
            EvaluationRequest(
                loanTermYears=10,
                customMarketVariations=[0.0, 0.01],
            )
        )

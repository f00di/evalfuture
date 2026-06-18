from __future__ import annotations

from dataclasses import dataclass

from .schemas import (
    AmortizationRow,
    AmortizationSummaryRow,
    ComparisonRow,
    DerivedValues,
    EvaluationPreview,
    EvaluationRequest,
    MarketRow,
    Totals,
)


def pmt(rate: float, nper: int, pv: float, fv: float = 0, payment_type: int = 0) -> float:
    """Excel-compatible PMT sign convention for fixed-rate loans."""
    if nper <= 0:
        raise ValueError("nper must be positive")
    if rate == 0:
        return -(pv + fv) / nper
    factor = (1 + rate) ** nper
    return -((pv * factor + fv) * rate) / ((1 + rate * payment_type) * (factor - 1))


def build_default_market_variations(loan_term_years: int) -> list[float]:
    variations: list[float] = []
    for index in range(loan_term_years):
        if index < 2:
            variations.append(0.0)
        else:
            variations.append(variations[index - 1] - 0.02)
    return variations


def normalize_custom_variations(
    values: list[float | None] | None,
    loan_term_years: int,
) -> list[float | None]:
    if values is None:
        return [None] * loan_term_years
    if len(values) != loan_term_years:
        raise ValueError("custom market variation rows must match loan term")
    return values


def build_amortization_schedule(
    annual_rate: float,
    loan_term_years: int,
    loan_amount: float,
    payments_per_year: int = 1,
    periods: int | None = None,
) -> list[AmortizationRow]:
    total_periods = loan_term_years * payments_per_year
    output_periods = periods or total_periods
    period_rate = annual_rate / payments_per_year
    payment = pmt(period_rate, total_periods, loan_amount)
    balance = loan_amount
    rows: list[AmortizationRow] = []

    for period in range(1, output_periods + 1):
        if period <= total_periods:
            interest = -balance * period_rate
            principal = payment - interest
            balance = max(0.0, balance + principal)
            rows.append(
                AmortizationRow(
                    period=period,
                    payment=payment,
                    interest=interest,
                    principal=principal,
                    balance=balance,
                )
            )
        else:
            rows.append(
                AmortizationRow(
                    period=period,
                    payment=0.0,
                    interest=0.0,
                    principal=0.0,
                    balance=0.0,
                )
            )
    return rows


def _selected_variation(
    scenario: str,
    default_variation: float,
    custom_variation: float | None,
) -> float:
    if scenario == "Custom" and custom_variation is not None:
        return custom_variation
    return default_variation


@dataclass(frozen=True)
class _CoreValues:
    down_payment: float
    purchase_cost: float
    rent_per_year: float
    service_charges_year: float
    initial_funds: float
    principal_loan: float


def _core_values(inputs: EvaluationRequest) -> _CoreValues:
    down_payment = inputs.propertyNetPurchasePrice * inputs.downPaymentPct
    purchase_cost = inputs.propertyNetPurchasePrice * inputs.purchaseCostPct
    rent_per_year = inputs.propertyNetPurchasePrice * inputs.rentYieldPct
    service_charges_year = inputs.serviceChargePerSqFt * inputs.areaSqFt
    return _CoreValues(
        down_payment=down_payment,
        purchase_cost=purchase_cost,
        rent_per_year=rent_per_year,
        service_charges_year=service_charges_year,
        initial_funds=down_payment + purchase_cost,
        principal_loan=inputs.propertyNetPurchasePrice - down_payment,
    )


def calculate_preview(inputs: EvaluationRequest) -> EvaluationPreview:
    custom_variations = normalize_custom_variations(
        inputs.customMarketVariations,
        inputs.loanTermYears,
    )
    core = _core_values(inputs)
    amortization = build_amortization_schedule(
        inputs.mortgageRatePct,
        inputs.loanTermYears,
        core.principal_loan,
    )
    yearly_payment = -amortization[0].payment
    monthly_payment = yearly_payment / 12
    total_bank_payment = yearly_payment * inputs.loanTermYears
    total_interest = total_bank_payment - core.principal_loan

    derived = DerivedValues(
        downPaymentAmount=core.down_payment,
        purchaseCostAmount=core.purchase_cost,
        currentRentPerYear=core.rent_per_year,
        serviceChargesYear=core.service_charges_year,
        totalInitialFundsRequired=core.initial_funds,
        principalLoan=core.principal_loan,
        monthlyBankInstalment=monthly_payment,
        yearlyBankInstalment=yearly_payment,
        totalBankPayment=total_bank_payment,
        totalInterest=total_interest,
        totalInterestPct=total_interest / core.principal_loan if core.principal_loan else 0,
        serviceChargesMonth=core.service_charges_year / 12,
        netRentalYear=core.rent_per_year - core.service_charges_year,
        totalCost=inputs.propertyNetPurchasePrice + core.purchase_cost + total_interest,
    )

    default_variations = build_default_market_variations(inputs.loanTermYears)
    market_rows: list[MarketRow] = []
    for year, default_variation, custom_variation in zip(
        range(1, inputs.loanTermYears + 1),
        default_variations,
        custom_variations,
    ):
        selected = _selected_variation(inputs.scenario, default_variation, custom_variation)
        market_rows.append(
            MarketRow(
                year=year,
                defaultMarketVariation=default_variation,
                defaultSellingPrice=inputs.propertyNetPurchasePrice * (1 + default_variation),
                customMarketVariation=custom_variation,
                customSellingPrice=(
                    inputs.propertyNetPurchasePrice * (1 + custom_variation)
                    if custom_variation is not None
                    else None
                ),
                selectedMarketVariation=selected,
                selectedSellingPrice=inputs.propertyNetPurchasePrice * (1 + selected),
            )
        )

    comparison_rows: list[ComparisonRow] = []
    previous_rental_net_total = 0.0
    previous_total_principal = 0.0
    for index, market in enumerate(market_rows):
        interest = -amortization[index].interest
        principal = -amortization[index].principal
        yearly_instalments = interest + principal
        rent = derived.currentRentPerYear * (1 + market.selectedMarketVariation)
        if index == 0:
            funds_available = core.initial_funds
            earning = funds_available * inputs.savingsProfitRatePct
            rental_net_total = earning
            total_principal = principal
        else:
            previous = comparison_rows[index - 1]
            funds_available = previous.rentalNetTotal + previous.totalCost - rent
            earning = funds_available * inputs.savingsProfitRatePct
            rental_net_total = previous_rental_net_total + earning
            total_principal = previous_total_principal + principal

        total_cost = yearly_instalments + derived.serviceChargesYear
        settlement_base = max(0.0, derived.principalLoan - total_principal)
        early_settlement = min(10_000.0, settlement_base * inputs.earlyPaymentFeePct)
        property_price = inputs.propertyNetPurchasePrice * (1 + market.selectedMarketVariation)
        net_total_resale = (
            (derived.downPaymentAmount + total_principal)
            * (1 + market.selectedMarketVariation)
            - early_settlement
        )
        options_comparison = net_total_resale - rental_net_total - derived.purchaseCostAmount

        row = ComparisonRow(
            year=market.year,
            rent=rent,
            fundsAvailable=funds_available,
            earningOnAvailableFunds=earning,
            rentalNetTotal=rental_net_total,
            yearlyBankInstalments=yearly_instalments,
            bankInterest=interest,
            bankPrincipal=principal,
            totalPrincipal=total_principal,
            totalCost=total_cost,
            earlySettlementCost=early_settlement,
            marketVariation=market.selectedMarketVariation,
            propertyMarketPrice=property_price,
            netTotalResale=net_total_resale,
            optionsComparison=options_comparison,
        )
        comparison_rows.append(row)
        previous_rental_net_total = rental_net_total
        previous_total_principal = total_principal

    amortization_summary_rows: list[AmortizationSummaryRow] = []
    for row in comparison_rows:
        ending_balance = max(0.0, derived.principalLoan - row.totalPrincipal)
        amortization_summary_rows.append(
            AmortizationSummaryRow(
                year=row.year,
                interest=row.bankInterest,
                principal=row.bankPrincipal,
                endingBalance=ending_balance,
                totalInstalment=row.yearlyBankInstalments,
                interestPrincipalRatio=(
                    row.bankInterest / row.bankPrincipal if row.bankPrincipal else 0
                ),
                decrease=row.bankPrincipal,
                interestTotalInterestRatio=(
                    row.bankInterest / derived.totalInterest if derived.totalInterest else 0
                ),
            )
        )

    totals = Totals(
        yearlyBankInstalments=sum(row.yearlyBankInstalments for row in comparison_rows),
        bankInterest=sum(row.bankInterest for row in comparison_rows),
        bankPrincipal=sum(row.bankPrincipal for row in comparison_rows),
    )

    return EvaluationPreview(
        inputs=inputs,
        derived=derived,
        marketRows=market_rows,
        comparisonRows=comparison_rows,
        amortizationRows=amortization,
        amortizationSummaryRows=amortization_summary_rows,
        totals=totals,
        finalOptionsComparison=comparison_rows[-1].optionsComparison if comparison_rows else 0,
    )

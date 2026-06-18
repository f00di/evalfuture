from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Scenario = Literal["Default", "Custom"]


class EvaluationRequest(BaseModel):
    propertyName: str = Field(default="2 BR Apartment in Reem Island", min_length=1)
    propertyNetPurchasePrice: float = Field(default=1_500_000, gt=0)
    areaSqFt: float = Field(default=1_200, gt=0)
    downPaymentPct: float = Field(default=0.20, ge=0, le=1)
    purchaseCostPct: float = Field(default=0.05, ge=0, le=1)
    loanTermYears: int = Field(default=10, ge=1, le=40)
    mortgageRatePct: float = Field(default=0.037, ge=0, le=1)
    earlyPaymentFeePct: float = Field(default=0.01, ge=0, le=1)
    rentYieldPct: float = Field(default=0.075, ge=0, le=1)
    serviceChargePerSqFt: float = Field(default=13, ge=0)
    savingsProfitRatePct: float = Field(default=0.05, ge=0, le=1)
    scenario: Scenario = "Default"
    customMarketVariations: list[float | None] | None = None


class DerivedValues(BaseModel):
    downPaymentAmount: float
    purchaseCostAmount: float
    currentRentPerYear: float
    serviceChargesYear: float
    totalInitialFundsRequired: float
    principalLoan: float
    monthlyBankInstalment: float
    yearlyBankInstalment: float
    totalBankPayment: float
    totalInterest: float
    totalInterestPct: float
    serviceChargesMonth: float
    netRentalYear: float
    totalCost: float


class MarketRow(BaseModel):
    year: int
    defaultMarketVariation: float
    defaultSellingPrice: float
    customMarketVariation: float | None
    customSellingPrice: float | None
    selectedMarketVariation: float
    selectedSellingPrice: float


class ComparisonRow(BaseModel):
    year: int
    rent: float
    fundsAvailable: float
    earningOnAvailableFunds: float
    rentalNetTotal: float
    yearlyBankInstalments: float
    bankInterest: float
    bankPrincipal: float
    totalPrincipal: float
    totalCost: float
    earlySettlementCost: float
    marketVariation: float
    propertyMarketPrice: float
    netTotalResale: float
    optionsComparison: float


class AmortizationRow(BaseModel):
    period: int
    payment: float
    interest: float
    principal: float
    balance: float


class AmortizationSummaryRow(BaseModel):
    year: int
    interest: float
    principal: float
    endingBalance: float
    totalInstalment: float
    interestPrincipalRatio: float
    decrease: float
    interestTotalInterestRatio: float


class Totals(BaseModel):
    yearlyBankInstalments: float
    bankInterest: float
    bankPrincipal: float


class EvaluationPreview(BaseModel):
    inputs: EvaluationRequest
    derived: DerivedValues
    marketRows: list[MarketRow]
    comparisonRows: list[ComparisonRow]
    amortizationRows: list[AmortizationRow]
    amortizationSummaryRows: list[AmortizationSummaryRow]
    totals: Totals
    finalOptionsComparison: float

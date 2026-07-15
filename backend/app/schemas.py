from __future__ import annotations

import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator


Scenario = Literal["Default", "Custom"]
AmountPercentSource = Literal["amount", "percent"]
AreaUnit = Literal["sq. ft", "sq. m"]
CurrencyCode = Literal["AED", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "INR"]


class EvaluationRequest(BaseModel):
    customerName: str = Field(default="Sample Customer", min_length=1)
    customerEmail: str = Field(default="customer@example.com", min_length=3)
    customerPhone: str = Field(default="+971 50 000 0000", min_length=7)
    customerNotes: str = ""
    propertyName: str = Field(default="2 BR Apartment in Reem Island", min_length=1)
    currencyCode: CurrencyCode = "AED"
    propertyNetPurchasePrice: float = Field(default=1_500_000, gt=0)
    areaValue: float = Field(default=1_200, gt=0)
    areaUnit: AreaUnit = "sq. ft"
    areaSqFt: float = Field(default=1_200, gt=0)
    downPaymentAmount: float = Field(default=300_000, ge=0)
    downPaymentPct: float = Field(default=0.20, ge=0, le=1)
    downPaymentSource: AmountPercentSource = "percent"
    purchaseCostAmount: float = Field(default=75_000, ge=0)
    purchaseCostPct: float = Field(default=0.05, ge=0, le=1)
    purchaseCostSource: AmountPercentSource = "percent"
    loanTermYears: int = Field(default=10, ge=1, le=40)
    mortgageRatePct: float = Field(default=0.037, ge=0, le=1)
    earlyPaymentFeeAmount: float = Field(default=10_000, ge=0)
    earlyPaymentFeePct: float = Field(default=0.01, ge=0, le=1)
    earlyPaymentFeeSource: AmountPercentSource = "percent"
    currentRentPerYear: float = Field(default=112_500, ge=0)
    rentYieldPct: float = Field(default=0.075, ge=0, le=1)
    rentYieldSource: AmountPercentSource = "percent"
    serviceChargePerSqFt: float = Field(default=13, ge=0)
    savingsProfitAmount: float = Field(default=18_750, ge=0)
    savingsProfitRatePct: float = Field(default=0.05, ge=0, le=1)
    savingsProfitRateSource: AmountPercentSource = "percent"
    scenario: Scenario = "Default"
    customMarketVariations: list[float | None] | None = None

    @field_validator("customerName")
    @classmethod
    def validate_customer_name(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("customer name is required")
        return value.strip()

    @field_validator("customerEmail")
    @classmethod
    def validate_customer_email(cls, value: str) -> str:
        normalized = value.strip()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", normalized):
            raise ValueError("customer email must be valid")
        return normalized

    @field_validator("customerPhone")
    @classmethod
    def validate_customer_phone(cls, value: str) -> str:
        normalized = value.strip()
        digit_count = len(re.sub(r"\D", "", normalized))
        if digit_count < 7 or digit_count > 15:
            raise ValueError("customer phone must contain 7 to 15 digits")
        return normalized


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

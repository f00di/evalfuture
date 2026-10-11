import Alert from "@/components/ui/Alert";
import {
  EvaluationRequest,
  MAX_LOAN_TERM_YEARS,
  buildDefaultMarketVariations,
  money,
  percent
} from "@/lib/model";
import {
  AmountOrPercentInput,
  AreaUnitSelect,
  CurrencySelect,
  FieldGroup,
  InputWithSuffix,
  MoneyInput,
  NumberInput,
  PercentInput,
  TextAreaField,
  TextField,
  inputClass
} from "./fields";
import { Td, Th } from "./layout";
import type { AmountPercentKeys, AmountPercentValue, FieldErrors, UpdateField } from "./types";

export default function AssumptionsForm({
  form,
  normalizedForm,
  fieldErrors,
  updateField,
  updateLoanTerm,
  updateAmountPercent,
  updateCustomVariation,
  resetCustomVariation,
  resetMarketVariations
}: {
  form: EvaluationRequest;
  normalizedForm: EvaluationRequest;
  fieldErrors: FieldErrors | null;
  updateField: UpdateField;
  updateLoanTerm: (loanTermYears: number) => void;
  updateAmountPercent: (keys: AmountPercentKeys, value: AmountPercentValue) => void;
  updateCustomVariation: (index: number, value: string) => void;
  resetCustomVariation: (index: number) => void;
  resetMarketVariations: () => void;
}) {
  const initialFunds =
    normalizedForm.downPaymentAmount + normalizedForm.purchaseCostAmount;
  const principalLoan =
    normalizedForm.propertyNetPurchasePrice - normalizedForm.downPaymentAmount;

  return (
    <div className="grid min-w-0 gap-4">
      <nav aria-label="Questionnaire progress" className="overflow-x-auto pb-1">
        <ol className="flex min-w-[720px] items-start">
          {[
            ["Client", "client-details"],
            ["Property", "property-details"],
            ["Purchase & financing", "purchase-financing"],
            ["Rental & charges", "rental-charges"],
            ["Market", "market-assumptions"],
            ["Review", "review-calculate"]
          ].map(([label, id], index) => (
            <li key={id} className="relative flex-1 border-t border-slate-300 pt-4 first:border-tealFinance">
              <a href={`#${id}`} className="group block pr-3 text-xs font-semibold text-slateFinance hover:text-navy">
                <span className="absolute -top-3 left-0 flex size-6 items-center justify-center rounded-full bg-navy text-[11px] text-white group-focus-visible:ring-2 group-focus-visible:ring-tealFinance">
                  {index + 1}
                </span>
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <FieldGroup
        id="client-details"
        step={1}
        title="Customer Details"
        description="Your details are included in the on-screen summary and Excel comparison."
      >
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <TextField
            label="Customer name"
            value={form.customerName}
            invalid={fieldErrors?.customerName}
            onChange={(value) => updateField("customerName", value)}
          />
          <TextField
            label="Customer email"
            value={form.customerEmail}
            invalid={fieldErrors?.customerEmail}
            inputMode="email"
            onChange={(value) => updateField("customerEmail", value)}
          />
          <TextField
            label="Customer phone"
            value={form.customerPhone}
            invalid={fieldErrors?.customerPhone}
            inputMode="tel"
            onChange={(value) => updateField("customerPhone", value)}
          />
          <TextAreaField
            label="Customer notes / message (optional)"
            value={form.customerNotes}
            onChange={(value) => updateField("customerNotes", value)}
          />
        </div>
      </FieldGroup>

      <FieldGroup
        id="property-details"
        step={2}
        title="Property Details"
        description="Core property details used by the comparison and workbook."
      >
        <TextField
          label="Property name / description"
          value={form.propertyName}
          invalid={fieldErrors?.propertyName}
          onChange={(value) => updateField("propertyName", value)}
        />
        <CurrencySelect
          value={form.currencyCode}
          onChange={(value) => updateField("currencyCode", value)}
        />
        <div className="grid min-w-0 gap-3 lg:grid-cols-2">
          <MoneyInput
            label="Property net purchase price"
            value={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.propertyNetPurchasePrice}
            onChange={(value) => updateField("propertyNetPurchasePrice", value)}
          />
          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
            <MoneyInput
              label="Area value"
              value={form.areaValue}
              invalid={fieldErrors?.areaValue}
              onChange={(value) => updateField("areaValue", value)}
            />
            <AreaUnitSelect
              value={form.areaUnit}
              onChange={(value) => updateField("areaUnit", value)}
            />
          </div>
        </div>
        <p className="text-xs leading-5 text-slateFinance">
          Service charges are calculated using the area converted to sq. ft.
        </p>
        <Alert tone="info">
          Currency labels the assumptions and results only. Evalfuture. does not perform live
          exchange-rate conversion.
        </Alert>
      </FieldGroup>

      <FieldGroup
        id="purchase-financing"
        step={3}
        title="Purchase & Financing"
        description="Acquisition assumptions, loan term, mortgage rate, and estimated settlement cost."
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <AmountOrPercentInput
            label="Down payment"
            amount={form.downPaymentAmount}
            percent={form.downPaymentPct}
            source={form.downPaymentSource}
            base={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.downPayment}
            onChange={(value) =>
              updateAmountPercent(
                {
                  amount: "downPaymentAmount",
                  percent: "downPaymentPct",
                  source: "downPaymentSource"
                },
                value
              )
            }
          />
          <AmountOrPercentInput
            label="Purchase cost"
            amount={form.purchaseCostAmount}
            percent={form.purchaseCostPct}
            source={form.purchaseCostSource}
            base={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.purchaseCost}
            onChange={(value) =>
              updateAmountPercent(
                {
                  amount: "purchaseCostAmount",
                  percent: "purchaseCostPct",
                  source: "purchaseCostSource"
                },
                value
              )
            }
          />
          <NumberInput
            label="Loan payment period in years"
            value={form.loanTermYears}
            min={1}
            max={MAX_LOAN_TERM_YEARS}
            step={1}
            invalid={fieldErrors?.loanTermYears}
            onChange={updateLoanTerm}
          />
          <PercentInput
            label="Mortgage rate"
            value={form.mortgageRatePct}
            invalid={fieldErrors?.mortgageRatePct}
            onChange={(value) => updateField("mortgageRatePct", value)}
          />
          <div className="xl:col-span-2">
            <AmountOrPercentInput
              label="Early payment fee"
              amountLabel="Fixed currency fee/cap"
              amount={form.earlyPaymentFeeAmount}
              percent={form.earlyPaymentFeePct}
              source={form.earlyPaymentFeeSource}
              base={principalLoan}
              invalid={fieldErrors?.earlyPaymentFee}
              preserveAmountOnPercentChange
              helperText="Percentage mode applies the entered rate to the outstanding settlement balance. Amount mode uses the entered fixed fee, capped at that balance."
              onChange={(value) =>
                updateAmountPercent(
                  {
                    amount: "earlyPaymentFeeAmount",
                    percent: "earlyPaymentFeePct",
                    source: "earlyPaymentFeeSource"
                  },
                  value
                )
              }
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        id="rental-charges"
        step={4}
        title="Rental & Service Charges"
        description="Rental return, service charges, and the savings profit assumption."
      >
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <AmountOrPercentInput
            label="Current rent of property per year"
            amount={form.currentRentPerYear}
            percent={form.rentYieldPct}
            source={form.rentYieldSource}
            base={form.propertyNetPurchasePrice}
            invalid={fieldErrors?.rentYield}
            onChange={(value) =>
              updateAmountPercent(
                {
                  amount: "currentRentPerYear",
                  percent: "rentYieldPct",
                  source: "rentYieldSource"
                },
                value
              )
            }
          />
          <MoneyInput
            label="Service charges per sq. ft/year"
            value={form.serviceChargePerSqFt}
            invalid={fieldErrors?.serviceChargePerSqFt}
            onChange={(value) => updateField("serviceChargePerSqFt", value)}
          />
          <div className="rounded-md border border-slate-200 bg-white px-3 py-3 text-sm">
            <p className="font-medium text-slateFinance">Service charges per year</p>
            <p className="numeric mt-1 font-semibold text-navy">
              {money(
                normalizedForm.serviceChargePerSqFt * normalizedForm.areaSqFt,
                normalizedForm.currencyCode
              )}
            </p>
          </div>
          <div className="xl:col-span-2">
            <AmountOrPercentInput
              label="Profit rate your savings can earn per year"
              amountLabel="First-year earnings"
              amount={form.savingsProfitAmount}
              percent={form.savingsProfitRatePct}
              source={form.savingsProfitRateSource}
              base={initialFunds}
              invalid={fieldErrors?.savingsProfitRate}
              helperText="Currency value is converted into an equivalent first-year rate based on down payment plus purchase cost."
              onChange={(value) =>
                updateAmountPercent(
                  {
                    amount: "savingsProfitAmount",
                    percent: "savingsProfitRatePct",
                    source: "savingsProfitRateSource"
                  },
                  value
                )
              }
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        id="market-assumptions"
        step={5}
        title="Market Assumptions"
        description="Review and edit yearly market assumptions before generating the comparison."
      >
        <MarketAssumptionsInput
          form={normalizedForm}
          updateField={updateField}
          updateCustomVariation={updateCustomVariation}
          resetCustomVariation={resetCustomVariation}
          resetMarketVariations={resetMarketVariations}
        />
      </FieldGroup>

      <FieldGroup
        id="review-calculate"
        step={6}
        title="Review & Calculate"
        description="Check the central assumptions below. You can return to any section before generating results."
      >
        <dl className="grid gap-3 rounded-control border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <ReviewItem label="Property price" value={money(normalizedForm.propertyNetPurchasePrice, normalizedForm.currencyCode)} />
          <ReviewItem label="Initial funds" value={money(initialFunds, normalizedForm.currencyCode)} />
          <ReviewItem label="Principal loan" value={money(principalLoan, normalizedForm.currencyCode)} />
          <ReviewItem label="Loan term" value={`${normalizedForm.loanTermYears} years`} />
          <ReviewItem label="Annual rent" value={money(normalizedForm.currentRentPerYear, normalizedForm.currencyCode)} />
          <ReviewItem label="Market scenario" value={normalizedForm.scenario} />
        </dl>
        <p className="text-xs leading-5 text-slateFinance">
          Results are estimates under the entered assumptions. Year 0 is used only as a chart
          baseline and is not added to payment or amortization rows.
        </p>
      </FieldGroup>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slateFinance">{label}</dt>
      <dd className="numeric mt-1 font-semibold text-navy">{value}</dd>
    </div>
  );
}

function MarketAssumptionsInput({
  form,
  updateField,
  updateCustomVariation,
  resetCustomVariation,
  resetMarketVariations
}: {
  form: EvaluationRequest;
  updateField: UpdateField;
  updateCustomVariation: (index: number, value: string) => void;
  resetCustomVariation: (index: number) => void;
  resetMarketVariations: () => void;
}) {
  const defaultVariations = buildDefaultMarketVariations(form.loanTermYears);

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-slateFinance">
          Select Default, or choose Custom and enter overrides for individual years.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-medium text-slateFinance">
            Scenario
            <select
              value={form.scenario}
              onChange={(event) => updateField("scenario", event.target.value as EvaluationRequest["scenario"])}
              className={`${inputClass} h-10 min-w-32 bg-inputAmber/70`}
            >
              <option value="Default">Default</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          <button
            type="button"
            onClick={resetMarketVariations}
            className="h-10 w-fit rounded-md border border-tealFinance bg-white px-3 text-sm font-semibold text-tealFinance transition hover:bg-tealFinance hover:text-white"
          >
            Clear Custom Values
          </button>
        </div>
      </div>
      <div className="scrollbar-soft overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-xs sm:text-sm">
          <caption className="sr-only">
            Default and custom annual market assumptions. Blank Custom values use the
            corresponding Default value.
          </caption>
          <thead className="sticky top-0 z-10 bg-navy text-white">
            <tr>
              <Th>Year</Th>
              <Th>Default Variation</Th>
              <Th>Default Selling Price</Th>
              <Th>Custom Variation</Th>
              <Th>Selected Selling Price</Th>
            </tr>
          </thead>
          <tbody>
            {defaultVariations.map((defaultVariation, index) => {
              const customVariation = form.customMarketVariations[index];
              const isCustom = customVariation !== null;
              const selectedVariation =
                form.scenario === "Custom" && customVariation !== null
                  ? customVariation
                  : defaultVariation;
              return (
                <tr key={index + 1} className="border-t border-slate-200">
                  <Td>{index + 1}</Td>
                  <Td>{percent(defaultVariation)}</Td>
                  <Td>{money(form.propertyNetPurchasePrice * (1 + defaultVariation), form.currencyCode)}</Td>
                  <td className="px-2 py-2 align-top">
                    <div className="grid min-w-[150px] gap-1">
                      <InputWithSuffix
                        value={customVariation === null ? Number.NaN : customVariation * 100}
                        suffix="%"
                        allowNegative
                        ariaLabel={`Year ${index + 1} custom market variation`}
                        onChange={(value) =>
                          updateCustomVariation(
                            index,
                            Number.isFinite(value) ? String(value) : ""
                          )
                        }
                      />
                      <div className="flex items-center justify-end gap-2">
                        {isCustom && (
                          <span className="rounded-full bg-panelBlue px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-tealFinance">
                            Custom
                          </span>
                        )}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => resetCustomVariation(index)}
                            className="text-xs font-semibold text-slateFinance transition hover:text-tealFinance"
                          >
                            Reset row
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <Td>{money(form.propertyNetPurchasePrice * (1 + selectedVariation), form.currencyCode)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

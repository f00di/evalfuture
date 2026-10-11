import type { ReactNode } from "react";
import { useState } from "react";
import {
  AmountPercentSource,
  AreaUnit,
  CurrencyCode,
  currencyOptions
} from "@/lib/model";
import { calculatePercent, formatInputNumber, parseNumericInput } from "./format";
import type { AmountPercentValue } from "./types";

export const inputClass =
  "numeric h-11 w-full min-w-0 rounded-md border border-slate-300 bg-inputAmber/70 px-3 text-sm text-navy outline-none transition placeholder:text-slate-400 focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20";
export const invalidInputClass =
  "border-riskRed bg-[#fff5f5] focus:border-riskRed focus:ring-riskRed/20";

export function FieldGroup({
  id,
  step,
  title,
  description,
  children
}: {
  id?: string;
  step?: number;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="min-w-0 scroll-mt-24 rounded-panel border border-slate-200 bg-creamFinance/70 p-4 sm:p-5">
      <div className="border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          {step && <span className="flex size-8 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">{step}</span>}
          <h3 className="text-base font-semibold text-navy">{title}</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-slateFinance">{description}</p>
      </div>
      <div className="mt-4 grid min-w-0 gap-3">{children}</div>
    </section>
  );
}

export function TextField({
  label,
  value,
  invalid,
  inputMode,
  onChange
}: {
  label: string;
  value: string;
  invalid?: boolean;
  inputMode?: "email" | "tel" | "text";
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} ${invalid ? invalidInputClass : ""}`}
        aria-invalid={invalid ? "true" : undefined}
        required={!label.includes("(optional)")}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm lg:col-span-2">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass} h-auto min-h-24 py-3`}
      />
    </label>
  );
}

export function MoneyInput({
  label,
  value,
  invalid,
  onChange
}: {
  label: string;
  value: number;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <NumericTextInput value={value} invalid={invalid} onChange={onChange} />
    </label>
  );
}

export function NumberInput({
  label,
  value,
  min,
  max,
  step,
  invalid,
  onChange
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <NumericTextInput
        value={value}
        min={min}
        max={max}
        step={step}
        invalid={invalid}
        onChange={onChange}
      />
    </label>
  );
}

export function PercentInput({
  label,
  value,
  allowNegative = false,
  invalid,
  onChange
}: {
  label: string;
  value: number;
  allowNegative?: boolean;
  invalid?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">{label}</span>
      <InputWithSuffix
        value={Number.isFinite(value) ? value * 100 : Number.NaN}
        suffix="%"
        allowNegative={allowNegative}
        invalid={invalid}
        onChange={(nextValue) => onChange(Number.isFinite(nextValue) ? nextValue / 100 : Number.NaN)}
      />
    </label>
  );
}

export function AmountOrPercentInput({
  label,
  amount,
  percent: percentValue,
  source,
  base,
  amountLabel = "Currency value",
  percentLabel = "%",
  helperText,
  invalid,
  preserveAmountOnPercentChange = false,
  onChange
}: {
  label: string;
  amount: number;
  percent: number;
  source: AmountPercentSource;
  base: number;
  amountLabel?: string;
  percentLabel?: string;
  helperText?: string;
  invalid?: boolean;
  preserveAmountOnPercentChange?: boolean;
  onChange: (value: AmountPercentValue) => void;
}) {
  const activeAmount = source === "amount";
  const activePercent = source === "percent";

  const updateAmount = (nextAmount: number) => {
    onChange({
      amount: nextAmount,
      percent: calculatePercent(nextAmount, base),
      source: "amount"
    });
  };

  const updatePercent = (nextPercentDisplayValue: number) => {
    const nextPercent = Number.isFinite(nextPercentDisplayValue)
      ? nextPercentDisplayValue / 100
      : Number.NaN;
    onChange({
      amount:
        preserveAmountOnPercentChange || !Number.isFinite(base) || base <= 0
          ? amount
          : base * nextPercent,
      percent: nextPercent,
      source: "percent"
    });
  };

  return (
    <div className="grid min-w-0 gap-1.5 text-sm">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="font-medium leading-5 text-slateFinance">{label}</span>
        <div className="inline-flex w-fit rounded-control border border-slate-300 bg-white p-0.5" role="group" aria-label={`${label} input mode`}>
          <button
            type="button"
            aria-pressed={activeAmount}
            onClick={() => updateAmount(amount)}
            className={`min-h-9 rounded-[6px] px-3 text-xs font-semibold transition ${activeAmount ? "bg-navy text-white shadow-sm" : "text-slateFinance hover:text-navy"}`}
          >
            {amountLabel}
          </button>
          <button
            type="button"
            aria-pressed={activePercent}
            onClick={() => updatePercent(Number.isFinite(percentValue) ? percentValue * 100 : 0)}
            className={`min-h-9 rounded-[6px] px-3 text-xs font-semibold transition ${activePercent ? "bg-navy text-white shadow-sm" : "text-slateFinance hover:text-navy"}`}
          >
            {percentLabel}
          </button>
        </div>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        <CompactNumberInput
          label={amountLabel}
          value={amount}
          invalid={invalid && activeAmount}
          active={activeAmount}
          onChange={updateAmount}
        />
        <CompactNumberInput
          label={percentLabel}
          value={Number.isFinite(percentValue) ? percentValue * 100 : Number.NaN}
          suffix="%"
          invalid={invalid && activePercent}
          active={activePercent}
          onChange={updatePercent}
        />
      </div>
      {helperText && <p className="text-xs leading-5 text-slateFinance">{helperText}</p>}
    </div>
  );
}

export function CompactNumberInput({
  label,
  value,
  suffix,
  invalid,
  active,
  onChange
}: {
  label: string;
  value: number;
  suffix?: string;
  invalid?: boolean;
  active?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <label
      className={`grid min-w-0 gap-1 rounded-md border bg-white p-2 ${
        active ? "border-tealFinance/60" : "border-slate-200"
      }`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slateFinance">
        {label}
      </span>
      {suffix ? (
        <InputWithSuffix value={value} suffix={suffix} invalid={invalid} onChange={onChange} />
      ) : (
        <NumericTextInput value={value} invalid={invalid} onChange={onChange} />
      )}
    </label>
  );
}

export function AreaUnitSelect({
  value,
  invalid,
  onChange
}: {
  value: AreaUnit;
  invalid?: boolean;
  onChange: (value: AreaUnit) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">Area unit</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as AreaUnit)}
        className={`${inputClass} ${invalid ? invalidInputClass : ""}`}
      >
        <option value="sq. ft">sq. ft</option>
        <option value="sq. m">sq. m</option>
      </select>
    </label>
  );
}

export function CurrencySelect({
  value,
  invalid,
  onChange
}: {
  value: CurrencyCode;
  invalid?: boolean;
  onChange: (value: CurrencyCode) => void;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium leading-5 text-slateFinance">Currency</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CurrencyCode)}
        className={`${inputClass} ${invalid ? invalidInputClass : ""}`}
      >
        {currencyOptions.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function InputWithSuffix({
  value,
  suffix,
  allowNegative = false,
  invalid,
  ariaLabel,
  onChange
}: {
  value: number;
  suffix: string;
  allowNegative?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div
      className={`flex h-11 min-w-0 overflow-hidden rounded-md border border-slate-300 bg-inputAmber/70 transition focus-within:border-tealFinance focus-within:ring-2 focus-within:ring-tealFinance/20 ${
        invalid ? invalidInputClass : ""
      }`}
    >
      <NumericTextInput
        value={value}
        allowNegative={allowNegative}
        embedded
        ariaLabel={ariaLabel}
        onChange={onChange}
      />
      <span className="flex h-full w-9 shrink-0 items-center justify-center border-l border-slate-300 text-xs font-semibold text-slateFinance">
        {suffix}
      </span>
    </div>
  );
}

export function NumericTextInput({
  value,
  min,
  max,
  step,
  allowNegative = false,
  embedded = false,
  invalid,
  ariaLabel,
  onChange
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  allowNegative?: boolean;
  embedded?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
  onChange: (value: number) => void;
}) {
  // The raw draft is only shown while editing; otherwise the formatted value is shown.
  const [draft, setDraft] = useState(formatInputNumber(value));
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (nextDraft: string) => {
    setDraft(nextDraft);
    const parsed = parseNumericInput(nextDraft);
    onChange(parsed);
  };

  const handleFocus = () => {
    setDraft(formatInputNumber(value));
    setIsFocused(true);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={isFocused ? draft : formatInputNumber(value)}
      min={min}
      max={max}
      step={step}
      onFocus={handleFocus}
      onBlur={() => setIsFocused(false)}
      onChange={(event) => handleChange(event.target.value)}
      className={
        embedded
          ? "numeric h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-navy outline-none"
          : `${inputClass} ${invalid ? invalidInputClass : ""}`
      }
      aria-invalid={invalid ? "true" : undefined}
      aria-label={ariaLabel}
      data-allow-negative={allowNegative ? "true" : "false"}
    />
  );
}

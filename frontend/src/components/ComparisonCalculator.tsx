"use client";

import { useMemo, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import {
  EvaluationRequest,
  MAX_LOAN_TERM_YEARS,
  calculatePreview,
  defaultRequest,
  fromPercentInput,
  normalizeEvaluationRequest,
  resizeCustomVariations
} from "@/lib/model";
import { generateWorkbookBlob, workbookFilename } from "@/lib/workbook";
import AssumptionsForm from "./calculator/AssumptionsForm";
import { ValidationSummary } from "./calculator/layout";
import ResultsSection from "./calculator/ResultsSection";
import type { AmountPercentKeys, AmountPercentValue, DownloadStatus } from "./calculator/types";
import { getFieldErrors, validateForm } from "./calculator/validation";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

export default function ComparisonCalculator() {
  const [form, setForm] = useState<EvaluationRequest>(defaultRequest);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const resultsRef = useRef<HTMLElement>(null);
  const validationRef = useRef<HTMLDivElement>(null);

  const normalizedForm = useMemo(() => normalizeEvaluationRequest(form), [form]);
  const validationErrors = useMemo(() => validateForm(form), [form]);
  const fieldErrors = useMemo(() => getFieldErrors(form), [form]);

  // Once generated, results follow every valid edit and hide while the form is invalid.
  const preview = useMemo(
    () => (hasGenerated && validationErrors.length === 0 ? calculatePreview(form) : null),
    [form, hasGenerated, validationErrors.length]
  );

  const updateForm = (updater: (current: EvaluationRequest) => EvaluationRequest) => {
    setForm((current) => normalizeEvaluationRequest(updater(current)));
  };

  const updateField = <K extends keyof EvaluationRequest>(
    key: K,
    value: EvaluationRequest[K]
  ) => {
    updateForm((current) => ({ ...current, [key]: value }));
  };

  const updateLoanTerm = (loanTermYears: number) => {
    updateForm((current) => {
      const rowCount = Number.isFinite(loanTermYears)
        ? Math.max(0, Math.min(MAX_LOAN_TERM_YEARS, Math.trunc(loanTermYears)))
        : 0;
      return {
        ...current,
        loanTermYears,
        customMarketVariations: resizeCustomVariations(current.customMarketVariations, rowCount)
      };
    });
  };

  const updateAmountPercent = (
    keys: AmountPercentKeys,
    value: AmountPercentValue
  ) => {
    updateForm((current) => ({
      ...current,
      [keys.amount]: value.amount,
      [keys.percent]: value.percent,
      [keys.source]: value.source
    }));
  };

  const generateComparison = () => {
    setShowValidation(true);
    setDownloadError(null);
    const errors = validateForm(form);
    if (errors.length > 0) {
      setHasGenerated(false);
      window.setTimeout(() => validationRef.current?.focus(), 0);
      return;
    }

    setHasGenerated(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      resultsRef.current?.focus({ preventScroll: true });
      resultsRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
      });
    }, 50);
  };

  const resetAssumptions = () => {
    const hasChanges = JSON.stringify(form) !== JSON.stringify(defaultRequest);
    if (
      hasChanges &&
      !window.confirm("Reset all entered assumptions and clear the generated results?")
    ) {
      return;
    }
    setForm(defaultRequest);
    setHasGenerated(false);
    setShowValidation(false);
    setDownloadError(null);
    setDownloadStatus("idle");
  };

  const updateCustomVariation = (index: number, value: string) => {
    const parsed = fromPercentInput(value);
    updateForm((current) => {
      const next = resizeCustomVariations(current.customMarketVariations, current.loanTermYears);
      next[index] = parsed;
      return { ...current, customMarketVariations: next };
    });
  };

  const resetCustomVariation = (index: number) => {
    updateForm((current) => {
      const next = resizeCustomVariations(current.customMarketVariations, current.loanTermYears);
      next[index] = null;
      return { ...current, customMarketVariations: next };
    });
  };

  const resetMarketVariations = () => {
    updateForm((current) => ({
      ...current,
      customMarketVariations: Array.from({ length: current.loanTermYears }, () => null)
    }));
  };

  const downloadWorkbook = async () => {
    if (isDownloading) return;
    const errors = validateForm(form);
    if (errors.length > 0) {
      setShowValidation(true);
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    setDownloadStatus("preparing");
    try {
      const currentPreview = preview ?? calculatePreview(form);
      let blob: Blob | null = null;
      let usedFallback = false;
      if (apiBaseUrl) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/export`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentPreview.inputs)
          });
          if (!response.ok) throw new Error("Backend export unavailable.");
          blob = await response.blob();
        } catch {
          usedFallback = true;
        }
      }
      blob ??= generateWorkbookBlob(currentPreview);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = workbookFilename(currentPreview.inputs.propertyName);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      setDownloadStatus(usedFallback ? "fallback" : "success");
    } catch (error) {
      setDownloadError((error as Error).message);
      setDownloadStatus("error");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <section id="calculator" className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-tealFinance">
          Free Initial Comparison
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">
          Tell us about you, then the property
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slateFinance sm:text-base">
          Enter the assumptions you want the model to use. Results, charts, tables, and the Excel
          download appear after the questionnaire is complete.
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <AssumptionsForm
          form={form}
          normalizedForm={normalizedForm}
          fieldErrors={showValidation ? fieldErrors : null}
          updateField={updateField}
          updateLoanTerm={updateLoanTerm}
          updateAmountPercent={updateAmountPercent}
          updateCustomVariation={updateCustomVariation}
          resetCustomVariation={resetCustomVariation}
          resetMarketVariations={resetMarketVariations}
        />

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm leading-6 text-slateFinance">
            <p className="font-semibold text-navy">Ready to generate your comparison?</p>
            <p>Market variation rows match the selected loan term and are included in the results.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={resetAssumptions}
              variant="outline"
            >
              Reset Assumptions
            </Button>
            <Button
              onClick={generateComparison}
            >
              Generate My Free Comparison
            </Button>
          </div>
        </div>

        {showValidation && validationErrors.length > 0 && (
          <ValidationSummary refTarget={validationRef} errors={validationErrors} />
        )}
      </div>

      {hasGenerated && preview && (
        <ResultsSection
          refTarget={resultsRef}
          preview={preview}
          isDownloading={isDownloading}
          downloadError={downloadError}
          downloadStatus={downloadStatus}
          downloadWorkbook={downloadWorkbook}
        />
      )}
    </section>
  );
}

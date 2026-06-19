"use client";

import { useRef, useState } from "react";
import ComparisonCalculator from "@/components/ComparisonCalculator";
import FreeComparisonPreview from "./FreeComparisonPreview";

export default function FreeComparisonFlow() {
  const [isStarted, setIsStarted] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const startComparison = () => {
    setIsStarted(true);
    window.setTimeout(() => {
      calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-tealFinance">
            Free comparison preview
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-navy">
            See what the workbook covers before opening the model
          </h2>
          <p className="mt-3 text-sm leading-6 text-slateFinance">
            The free comparison starts with a short outline of the assumptions and outputs. Open the
            detailed model when you are ready to enter property figures.
          </p>
          <button
            type="button"
            onClick={startComparison}
            className="mt-6 rounded-md bg-tealFinance px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b625b]"
          >
            Start My Free Comparison
          </button>
        </div>
        <FreeComparisonPreview showCta={false} />
      </div>

      {isStarted && (
        <div ref={calculatorRef} className="scroll-mt-24">
          <ComparisonCalculator />
        </div>
      )}
    </div>
  );
}

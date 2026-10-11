import type { ReactNode, RefObject } from "react";

export function CalculatorBlock({
  title,
  detail,
  children
}: {
  title: string;
  detail?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-navy">{title}</h3>
        {detail && <p className="mt-1 text-sm leading-6 text-slateFinance">{detail}</p>}
      </div>
      {children}
    </section>
  );
}

export function ValidationSummary({
  refTarget,
  errors
}: {
  refTarget: RefObject<HTMLDivElement | null>;
  errors: string[];
}) {
  return (
    <section
      ref={refTarget}
      tabIndex={-1}
      role="alert"
      aria-labelledby="validation-summary-heading"
      className="mt-5 rounded-md border border-riskRed/20 bg-[#fff7f7] p-4 text-sm text-riskRed outline-none"
    >
      <p id="validation-summary-heading" className="font-semibold">
        Please complete these fields before generating results:
      </p>
      <ul className="mt-2 grid gap-1">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </section>
  );
}

export function Th({ children, colSpan, className = "" }: { children: ReactNode; colSpan?: number; className?: string }) {
  return (
    <th
      colSpan={colSpan}
      className={`whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <td className={`numeric whitespace-nowrap px-3 py-2 text-right text-slateFinance ${className}`}>
      {children}
    </td>
  );
}

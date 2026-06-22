export default function CompactMetricCard({
  label,
  value,
  detail,
  tone = "default"
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: "default" | "positive" | "risk";
}) {
  const valueClass =
    tone === "positive" ? "text-positiveGreen" : tone === "risk" ? "text-riskRed" : "text-navy";

  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium leading-5 text-slateFinance">{label}</p>
      <p
        className={`numeric mt-2 max-w-full break-words text-lg font-semibold leading-tight sm:text-xl ${valueClass}`}
        title={detail ?? value}
      >
        {value}
      </p>
      {detail && <p className="numeric mt-1 break-words text-xs leading-5 text-slateFinance">{detail}</p>}
    </div>
  );
}

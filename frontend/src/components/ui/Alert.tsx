import type { ReactNode } from "react";

export default function Alert({
  children,
  title,
  tone = "info",
  live = false,
  className = ""
}: {
  children: ReactNode;
  title?: string;
  tone?: "info" | "success" | "error" | "warning";
  live?: boolean;
  className?: string;
}) {
  const tones = {
    info: "border-[#8fb7d2] bg-panelBlue/70 text-navy",
    success: "border-positiveGreen/30 bg-[#f0fdf7] text-positiveGreen",
    error: "border-riskRed/30 bg-[#fff7f7] text-riskRed",
    warning: "border-goldFinance/40 bg-inputAmber/50 text-navy"
  };

  return (
    <div
      className={`rounded-control border px-4 py-3 text-sm leading-6 ${tones[tone]} ${className}`}
      role={tone === "error" ? "alert" : "status"}
      aria-live={live ? "polite" : undefined}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : ""}>{children}</div>
    </div>
  );
}

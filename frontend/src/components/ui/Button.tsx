import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";

export default function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "border-tealFinance bg-tealFinance text-white hover:bg-[#0b625b]",
    secondary: "border-navy bg-navy text-white hover:bg-darkBlue",
    outline: "border-slate-300 bg-white text-navy hover:border-tealFinance hover:text-tealFinance",
    danger: "border-riskRed bg-white text-riskRed hover:bg-[#fff5f5]"
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 py-2.5 text-sm font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tealFinance focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

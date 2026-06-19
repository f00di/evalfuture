export default function SectionGlow({
  className = ""
}: {
  className?: string;
}) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-tealFinance/5 blur-3xl" />
      <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-navy/5 blur-3xl" />
    </div>
  );
}

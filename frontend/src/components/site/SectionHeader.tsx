export default function SectionHeader({
  eyebrow,
  title,
  body,
  align = "left",
  level = "h2"
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  level?: "h1" | "h2";
}) {
  const Heading = level;

  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-tealFinance">
          {eyebrow}
        </p>
      )}
      <Heading className="mt-3 text-3xl font-semibold leading-tight text-navy sm:text-4xl">
        {title}
      </Heading>
      {body && <p className="mt-4 text-base leading-7 text-slateFinance">{body}</p>}
    </div>
  );
}

import Link from "next/link";

export default function ServiceCard({
  title,
  body,
  cta,
  href,
  deliverables,
  bestFor
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  deliverables?: string[];
  bestFor?: string;
}) {
  return (
    <article className="flex min-w-0 flex-col border-t-2 border-tealFinance bg-white px-1 py-6">
      <h3 className="text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-4 flex-1 text-sm leading-6 text-slateFinance">{body}</p>
      {deliverables && (
        <div className="mt-5 border-l-2 border-panelBlue pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-tealFinance">
            Includes
          </p>
          <ul className="mt-2 grid gap-1.5 text-sm text-slateFinance">
            {deliverables.map((item) => (
              <li key={item}>— {item}</li>
            ))}
          </ul>
        </div>
      )}
      {bestFor && <p className="mt-4 text-xs leading-5 text-slateFinance"><strong className="text-navy">Appropriate for:</strong> {bestFor}</p>}
      <Link
        href={href}
        className="mt-6 inline-flex min-h-11 w-fit items-center rounded-control bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-darkBlue"
      >
        {cta}
      </Link>
    </article>
  );
}

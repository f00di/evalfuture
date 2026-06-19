import Link from "next/link";

export default function ServiceCard({
  title,
  body,
  cta,
  href
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <article className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <h3 className="text-xl font-semibold text-navy">{title}</h3>
      <p className="mt-4 flex-1 text-sm leading-6 text-slateFinance">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-flex w-fit rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102A43]"
      >
        {cta}
      </Link>
    </article>
  );
}

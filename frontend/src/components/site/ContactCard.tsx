import { contactDetails } from "@/lib/site";

export default function ContactCard({ inverse = false }: { inverse?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-5 ${
        inverse
          ? "border-white/15 bg-white/10 text-white"
          : "border-slate-200 bg-white text-slateFinance shadow-panel"
      }`}
    >
      <h3 className={`text-lg font-semibold ${inverse ? "text-white" : "text-navy"}`}>Contact</h3>
      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className={inverse ? "text-slate-300" : "text-slateFinance"}>Contact person</dt>
          <dd className={`mt-1 font-semibold ${inverse ? "text-white" : "text-navy"}`}>
            {contactDetails.name}
          </dd>
        </div>
        <div>
          <dt className={inverse ? "text-slate-300" : "text-slateFinance"}>Phone</dt>
          <dd className={`mt-1 font-semibold ${inverse ? "text-white" : "text-navy"}`}>
            {contactDetails.phone}
          </dd>
        </div>
        <div>
          <dt className={inverse ? "text-slate-300" : "text-slateFinance"}>Email</dt>
          <dd className={`mt-1 font-semibold ${inverse ? "text-white" : "text-navy"}`}>
            {contactDetails.email}
          </dd>
        </div>
      </dl>
    </div>
  );
}

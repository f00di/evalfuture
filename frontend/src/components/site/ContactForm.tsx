export default function ContactForm() {
  return (
    <form className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" type="text" />
        <FormField label="Email" type="email" />
      </div>
      <FormField label="Phone" type="tel" />
      <label className="grid gap-1 text-sm">
        <span className="font-medium text-slateFinance">Message</span>
        <textarea
          rows={5}
          className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
        />
      </label>
      <p className="rounded-md border border-goldFinance/30 bg-inputAmber/50 px-3 py-2 text-xs leading-5 text-slateFinance">
        This static GitHub Pages form is a front-end placeholder. Use the listed contact details
        unless a static-friendly form provider is configured later.
      </p>
      <button
        type="button"
        className="w-fit rounded-md bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#102A43]"
      >
        Prepare Message
      </button>
    </form>
  );
}

function FormField({ label, type }: { label: string; type: string }) {
  return (
    <label className="grid min-w-0 gap-1 text-sm">
      <span className="font-medium text-slateFinance">{label}</span>
      <input
        type={type}
        className="h-10 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
      />
    </label>
  );
}

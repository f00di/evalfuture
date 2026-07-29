"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { contactDetails } from "@/lib/site";

type SubmissionState =
  | { status: "idle"; message: string }
  | { status: "submitting"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";

function responseMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const candidate = payload as { message?: unknown; detail?: unknown };
  if (typeof candidate.message === "string") return candidate.message;
  if (typeof candidate.detail === "string") return candidate.detail;
  return null;
}

export default function ContactForm() {
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    message: ""
  });

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!apiBaseUrl) {
      setSubmission({
        status: "error",
        message:
          "Online inquiries are not configured yet. Please use the listed phone or email placeholders when approved contact details become available."
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    setSubmission({ status: "submitting", message: "Sending your inquiry…" });
    try {
      const response = await fetch(`${apiBaseUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          propertyLocation: formData.get("propertyLocation"),
          purpose: formData.get("purpose"),
          message: formData.get("message"),
          comparisonReference: formData.get("comparisonReference"),
          companyWebsite: formData.get("companyWebsite")
        })
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          responseMessage(payload) ||
            "The inquiry service is temporarily unavailable. Please try again later."
        );
      }
      form.reset();
      setSubmission({
        status: "success",
        message: responseMessage(payload) || "Your inquiry was received."
      });
    } catch (error) {
      setSubmission({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "The inquiry could not be sent. Please try again later."
      });
    }
  };

  return (
    <form
      onSubmit={submit}
      aria-busy={submission.status === "submitting"}
      className="grid gap-5 rounded-panel border border-slate-200 bg-white p-5 shadow-panel sm:p-6"
    >
      <div>
        <h2 className="text-xl font-semibold text-navy">Send an inquiry</h2>
        <p className="mt-2 text-sm leading-6 text-slateFinance">
          Share only the contact and property context needed for a follow-up. Do not include full
          financial assumptions or sensitive account information.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name" name="name" type="text" required maxLength={100} autoComplete="name" />
        <FormField label="Email" name="email" type="email" required maxLength={254} autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Phone (optional)" name="phone" type="tel" maxLength={30} autoComplete="tel" />
        <FormField
          label="Property location (optional)"
          name="propertyLocation"
          type="text"
          maxLength={160}
          autoComplete="street-address"
        />
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slateFinance">Purpose <span aria-hidden="true">*</span></span>
        <select
          name="purpose"
          required
          aria-required="true"
          defaultValue=""
          className="h-11 w-full rounded-control border border-slate-300 bg-white px-3 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
        >
          <option value="" disabled>Select a purpose</option>
          <option value="buy">Buy</option>
          <option value="rent">Rent</option>
          <option value="invest">Invest</option>
          <option value="rent out">Rent out</option>
          <option value="refinance">Refinance</option>
          <option value="other">Other</option>
        </select>
      </label>
      <FormField
        label="Comparison reference (optional)"
        name="comparisonReference"
        type="text"
        maxLength={100}
      />
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-slateFinance">Message <span aria-hidden="true">*</span></span>
        <textarea
          name="message"
          required
          aria-required="true"
          minLength={10}
          maxLength={2000}
          rows={6}
          className="w-full min-w-0 rounded-control border border-slate-300 bg-white px-3 py-3 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
        />
        <span className="text-xs leading-5 text-slateFinance">10–2,000 characters.</span>
      </label>

      <label className="absolute left-[-10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        Company website
        <input name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      {!apiBaseUrl && submission.status === "idle" && (
        <Alert tone="warning">
          The secure API integration is not configured on this static deployment. Contact
          placeholders remain Phone: {contactDetails.phone} and Email: {contactDetails.email}.
        </Alert>
      )}
      {submission.status !== "idle" && (
        <Alert
          tone={
            submission.status === "success"
              ? "success"
              : submission.status === "error"
                ? "error"
                : "info"
          }
          live
        >
          {submission.message}
        </Alert>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={submission.status === "submitting"}>
          {submission.status === "submitting" && (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          )}
          {submission.status === "submitting" ? "Sending…" : "Send inquiry"}
        </Button>
        <p className="text-xs leading-5 text-slateFinance">
          Submitting shares only the fields shown above with the configured Evalfuture. API.
        </p>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  type,
  required = false,
  maxLength,
  autoComplete
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium text-slateFinance">
        {label} {required && <span aria-hidden="true">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        aria-required={required ? "true" : undefined}
        maxLength={maxLength}
        autoComplete={autoComplete}
        className="h-11 w-full min-w-0 rounded-control border border-slate-300 bg-white px-3 text-navy outline-none transition focus:border-tealFinance focus:ring-2 focus:ring-tealFinance/20"
      />
    </label>
  );
}

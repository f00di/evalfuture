import {
  EvaluationRequest,
  getInputFieldErrors,
  inputFieldMessages,
  normalizeEvaluationRequest
} from "@/lib/model";
import type { FieldErrors } from "./types";

const customerFieldMessages = {
  customerName: "Customer name is required.",
  customerEmail: "Customer email must be a valid email address.",
  customerPhone: "Customer phone must contain 7 to 15 digits."
} as const;

export function getFieldErrors(form: EvaluationRequest): FieldErrors {
  const phoneDigits = form.customerPhone.replace(/\D/g, "");
  return {
    customerName: !form.customerName.trim(),
    customerEmail: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim()),
    customerPhone: phoneDigits.length < 7 || phoneDigits.length > 15,
    ...getInputFieldErrors(normalizeEvaluationRequest(form))
  };
}

export function validateForm(form: EvaluationRequest): string[] {
  const fields = getFieldErrors(form);
  const messages: Record<keyof FieldErrors, string> = {
    ...customerFieldMessages,
    ...inputFieldMessages
  };
  return (Object.keys(fields) as Array<keyof FieldErrors>)
    .filter((field) => fields[field])
    .map((field) => messages[field]);
}

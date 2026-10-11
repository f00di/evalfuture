import type { AmountPercentSource, EvaluationRequest, InputField } from "@/lib/model";

export type AmountPercentValue = {
  amount: number;
  percent: number;
  source: AmountPercentSource;
};

export type FieldErrors = Record<"customerName" | "customerEmail" | "customerPhone" | InputField, boolean>;

export type DownloadStatus = "idle" | "preparing" | "success" | "fallback" | "error";

export type UpdateField = <K extends keyof EvaluationRequest>(
  key: K,
  value: EvaluationRequest[K]
) => void;

export type AmountPercentKeys = {
  amount: keyof EvaluationRequest;
  percent: keyof EvaluationRequest;
  source: keyof EvaluationRequest;
};

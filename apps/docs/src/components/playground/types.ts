import type { ReactNode } from "react";

export type VariantKind = "react" | "standard";
export type OutputStatus = "idle" | "running" | "success" | "error";
export type VariantId = "react" | "form" | "jquery" | "js2form" | "core" | "form-data";

export interface ErrorInfo {
  message: string;
  source: "render" | "effect" | "bootstrap" | "event" | "async";
  detail?: string;
}

export interface ReactOutputState {
  kind: "react";
  status: OutputStatus;
  statusMessage: string;
  submitFlags: {
    isSubmitting: boolean;
    isError: boolean;
    isSuccess: boolean;
  };
  error: { message: string; detail?: string } | null;
  parsedPayload: unknown;
  meta?: Record<string, ReactNode>;
}

export interface StandardOutputState {
  kind: "standard";
  status: OutputStatus;
  statusMessage: string;
  errorMessage: string | null;
  parsedPayload: unknown;
}

export type OutputState = ReactOutputState | StandardOutputState;

export interface VariantComponentProps {
  isActive: boolean;
  onOutputChange: (outputState: OutputState) => void;
  reportFatalError: (errorInfo: ErrorInfo) => void;
}

export interface VariantDefinition {
  id: VariantId;
  kind: VariantKind;
  label: string;
  summary: string;
  packages: string[];
  createInitialOutputState: () => OutputState;
  Component: (props: VariantComponentProps) => ReactNode;
}

import type { OutputState, VariantDefinition, VariantId } from "./types";
import { CoreVariant } from "./variants/core-variant";
import { FormDataVariant } from "./variants/form-data-variant";
import { FormVariant } from "./variants/form-variant";
import { JQueryVariant } from "./variants/jquery-variant";
import { Js2FormVariant } from "./variants/js2form-variant";
import { ReactVariant } from "./variants/react-variant";

function createStandardIdle(statusMessage: string): OutputState {
  return {
    kind: "standard",
    status: "idle",
    statusMessage,
    errorMessage: null,
    parsedPayload: null
  };
}

function createReactIdle(statusMessage: string): OutputState {
  return {
    kind: "react",
    status: "idle",
    statusMessage,
    submitFlags: {
      isSubmitting: false,
      isError: false,
      isSuccess: false
    },
    error: null,
    parsedPayload: null
  };
}

export const variants = [
  {
    id: "react",
    kind: "react",
    label: "React",
    summary: "Submit forms with schema-aware async state.",
    packages: ["@form2js/react"],
    createInitialOutputState: () => createReactIdle("Ready to submit.")
  },
  {
    id: "form",
    kind: "standard",
    label: "Form",
    summary: "Parse a plain browser form with @form2js/dom or form2js().",
    packages: ["@form2js/dom"],
    createInitialOutputState: () => createStandardIdle("Ready to parse the form.")
  },
  {
    id: "jquery",
    kind: "standard",
    label: "jQuery",
    summary: "Use the jQuery plugin adapter with selectable modes.",
    packages: ["@form2js/jquery"],
    createInitialOutputState: () => createStandardIdle("Ready to run the plugin.")
  },
  {
    id: "js2form",
    kind: "standard",
    label: "js2form",
    summary: "Apply object data back into form controls.",
    packages: ["@form2js/js2form"],
    createInitialOutputState: () => createStandardIdle("Ready to apply object data.")
  },
  {
    id: "core",
    kind: "standard",
    label: "Core",
    summary: "Parse raw key/value entries into nested objects.",
    packages: ["@form2js/core"],
    createInitialOutputState: () => createStandardIdle("Ready to parse entry data.")
  },
  {
    id: "form-data",
    kind: "standard",
    label: "FormData",
    summary: "Convert FormData-like entries into structured objects.",
    packages: ["@form2js/form-data"],
    createInitialOutputState: () => createStandardIdle("Ready to parse form data.")
  }
] satisfies Omit<VariantDefinition, "Component">[];

export const VARIANT_IDS = variants.map((variant) => variant.id) satisfies VariantId[];

const variantComponents: Record<VariantId, VariantDefinition["Component"]> = {
  react: ReactVariant,
  form: FormVariant,
  jquery: JQueryVariant,
  js2form: Js2FormVariant,
  core: CoreVariant,
  "form-data": FormDataVariant
};

export const variantsById = Object.fromEntries(
  variants.map((variant) => [
    variant.id,
    {
      ...variant,
      Component: variantComponents[variant.id]
    }
  ])
) as Record<VariantId, VariantDefinition>;

// apps/docs/src/components/playground/variants/react-variant.tsx
import React, { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useForm2js } from "@form2js/react";

import type { ReactOutputState, VariantComponentProps } from "../types";

const SubmitPayloadSchema = z.object({
  person: z.object({
    name: z.object({
      first: z.string().min(1, "First name is required."),
      last: z.string().min(1, "Last name is required.")
    }),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email must be valid."),
    age: z.coerce.number().int().min(18, "Age must be at least 18."),
    guild: z.string().min(1, "Guild is required."),
    interests: z.array(z.string()).default([])
  })
});

type SubmitPayload = z.infer<typeof SubmitPayloadSchema>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("\n");
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

function createOutputState(
  isSubmitting: boolean,
  isError: boolean,
  isSuccess: boolean,
  error: unknown,
  lastSuccessfulPayload: SubmitPayload | null
): ReactOutputState {
  let status: ReactOutputState["status"] = "idle";
  let statusMessage = "Ready to submit.";
  if (isSubmitting) { status = "running"; statusMessage = "Callback running"; }
  else if (isError)  { status = "error";   statusMessage = "Submit failed"; }
  else if (isSuccess){ status = "success"; statusMessage = "Callback resolved"; }

  return {
    kind: "react",
    status,
    statusMessage,
    submitFlags: { isSubmitting, isError, isSuccess },
    error: isError ? { message: formatError(error) } : null,
    parsedPayload: lastSuccessfulPayload,
    meta: { submitMode: "onSubmit", validationEnabled: true }
  };
}

export function ReactVariant({ onOutputChange }: VariantComponentProps): React.JSX.Element {
  const [lastSuccessfulPayload, setLastSuccessfulPayload] = useState<SubmitPayload | null>(null);
  const onOutputChangeRef = useRef(onOutputChange);
  const forceErrorRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const { onSubmit, isSubmitting, isError, error, isSuccess, reset } = useForm2js(
    async (data: SubmitPayload) => {
      await sleep(850);
      if (forceErrorRef.current) {
        forceErrorRef.current = false;
        throw new Error("Simulated server error.");
      }
      setLastSuccessfulPayload(data);
    },
    { schema: SubmitPayloadSchema }
  );

  useEffect(() => { onOutputChangeRef.current = onOutputChange; }, [onOutputChange]);

  useEffect(() => {
    onOutputChangeRef.current(createOutputState(isSubmitting, isError, isSuccess, error, lastSuccessfulPayload));
  }, [error, isError, isSubmitting, isSuccess, lastSuccessfulPayload]);

  function handleReset(): void {
    reset();
    setLastSuccessfulPayload(null);
  }

  function handleForceError(): void {
    forceErrorRef.current = true;
    formRef.current?.requestSubmit();
  }

  return (
    <section aria-label="React variant">
      <form
        ref={formRef}
        onSubmit={(event) => { void onSubmit(event); }}
      >
        <div className="pg-field">
          <label className="pg-label" htmlFor="rv-first">person.name.first</label>
          <input className="pg-input" defaultValue="Sam" id="rv-first" name="person.name.first" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="rv-last">person.name.last</label>
          <input className="pg-input" defaultValue="Vimes" id="rv-last" name="person.name.last" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="rv-email">person.email</label>
          <input className="pg-input" defaultValue="sam.vimes@ankh-morpork.gov" id="rv-email" name="person.email" type="email" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="rv-age">person.age</label>
          <input className="pg-input" defaultValue={45} id="rv-age" min={0} name="person.age" type="number" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="rv-guild">person.guild</label>
          <select className="pg-select" defaultValue="watchman" id="rv-guild" name="person.guild">
            <option value="watchman">watchman</option>
            <option value="witches">witches</option>
            <option value="assassins">assassins</option>
            <option value="thieves">thieves</option>
          </select>
        </div>
        <fieldset className="pg-fieldset">
          <legend>person.interests[]</legend>
          <label className="pg-check-label">
            <input defaultChecked name="person.interests[]" type="checkbox" value="city-watch" />
            city-watch
          </label>
          <label className="pg-check-label">
            <input defaultChecked name="person.interests[]" type="checkbox" value="cigars" />
            cigars
          </label>
          <label className="pg-check-label">
            <input name="person.interests[]" type="checkbox" value="headology" />
            headology
          </label>
        </fieldset>
        <div className="pg-btns">
          <button className="pg-btn" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
          <button className="pg-btn pg-btn-secondary" onClick={handleReset} type="button">
            Reset state
          </button>
          <button
            className="pg-btn pg-btn-danger"
            disabled={isSubmitting}
            onClick={handleForceError}
            type="button"
          >
            {isSubmitting ? "Submitting…" : "Force Error"}
          </button>
        </div>
      </form>
    </section>
  );
}

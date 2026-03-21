// apps/docs/src/components/playground/variants/js2form-variant.tsx
import React, { useRef } from "react";
import { formToObject } from "@form2js/dom";
import { objectToForm } from "@form2js/js2form";

import type { StandardOutputState, VariantComponentProps } from "../types";

const INITIAL_JSON = `{
  "person": {
    "name": {
      "first": "Tiffany",
      "last": "Aching"
    },
    "city": "quirm",
    "tags": ["witch"]
  }
}`;

function createIdleState(): StandardOutputState {
  return { kind: "standard", status: "idle", statusMessage: "Ready to apply object data.", errorMessage: null, parsedPayload: null };
}

function createErrorState(message: string): StandardOutputState {
  return { kind: "standard", status: "error", statusMessage: "js2form apply failed.", errorMessage: message, parsedPayload: null };
}

function createSuccessState(parsedPayload: unknown): StandardOutputState {
  return { kind: "standard", status: "success", statusMessage: "@form2js/js2form -> objectToForm(...), then formToObject(...)", errorMessage: null, parsedPayload };
}

function formatVariantError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function Js2FormVariant({ onOutputChange }: VariantComponentProps): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);
  const jsonInputRef = useRef<HTMLTextAreaElement>(null);

  function handleApply(): void {
    const form = formRef.current;
    const jsonInput = jsonInputRef.current;
    if (!form || !jsonInput) { onOutputChange(createIdleState()); return; }

    let parsed: unknown;

    try {
      parsed = JSON.parse(jsonInput.value) as unknown;
    } catch {
      onOutputChange(createErrorState("JSON parse error: please provide valid JSON before applying js2form."));
      return;
    }

    try {
      objectToForm(form, parsed);
      onOutputChange(createSuccessState(formToObject(form)));
    } catch (error: unknown) {
      onOutputChange(createErrorState(`js2form runtime error: ${formatVariantError(error)}`));
    }
  }

  function handleReset(): void {
    const form = formRef.current;
    const jsonInput = jsonInputRef.current;
    if (form) form.reset();
    if (jsonInput) jsonInput.value = INITIAL_JSON;
    onOutputChange(createIdleState());
  }

  return (
    <section aria-label="js2form variant">
      <div className="pg-field">
        <label className="pg-label" htmlFor="j2f-json">input.json</label>
        <textarea className="pg-textarea" defaultValue={INITIAL_JSON} id="j2f-json" name="js2form-json" ref={jsonInputRef} rows={10} />
      </div>
      <form ref={formRef}>
        <div className="pg-field">
          <label className="pg-label" htmlFor="j2f-first">person.name.first</label>
          <input className="pg-input" defaultValue="Esme" id="j2f-first" name="person.name.first" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="j2f-last">person.name.last</label>
          <input className="pg-input" defaultValue="Weatherwax" id="j2f-last" name="person.name.last" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="j2f-city">person.city</label>
          <select className="pg-select" defaultValue="lancre" id="j2f-city" name="person.city">
            <option value="ankh-morpork">Ankh-Morpork</option>
            <option value="lancre">Lancre</option>
            <option value="quirm">Quirm</option>
          </select>
        </div>
        <fieldset className="pg-fieldset">
          <legend>person.tags[]</legend>
          <label className="pg-check-label">
            <input defaultChecked name="person.tags[]" type="checkbox" value="witch" />witch
          </label>
          <label className="pg-check-label">
            <input defaultChecked name="person.tags[]" type="checkbox" value="headology" />headology
          </label>
        </fieldset>
      </form>
      <div className="pg-btns">
        <button className="pg-btn" onClick={handleApply} type="button">Apply js2form</button>
        <button className="pg-btn pg-btn-secondary" onClick={handleReset} type="button">Reset form</button>
      </div>
    </section>
  );
}

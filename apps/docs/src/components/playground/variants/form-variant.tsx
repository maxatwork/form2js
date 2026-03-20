// apps/docs/src/components/playground/variants/form-variant.tsx
import React, { useRef } from "react";
import { form2js, formToObject } from "@form2js/dom";

import type { StandardOutputState, VariantComponentProps } from "../types";

function createIdleState(): StandardOutputState {
  return { kind: "standard", status: "idle", statusMessage: "Ready to parse the form.", errorMessage: null, parsedPayload: null };
}

function createSuccessState(statusMessage: string, parsedPayload: unknown): StandardOutputState {
  return { kind: "standard", status: "success", statusMessage, errorMessage: null, parsedPayload };
}

export function FormVariant({ onOutputChange }: VariantComponentProps): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = formRef.current;
    if (!form) { onOutputChange(createIdleState()); return; }
    onOutputChange(createSuccessState("@form2js/dom -> formToObject(form)", formToObject(form)));
  }

  function handleLegacyRun(): void {
    const form = formRef.current;
    if (!form) { onOutputChange(createIdleState()); return; }
    onOutputChange(createSuccessState("@form2js/dom -> form2js(form)", form2js(form)));
  }

  function handleReset(): void {
    formRef.current?.reset();
    onOutputChange(createIdleState());
  }

  return (
    <section aria-label="Form variant">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fv-first">person.name.first</label>
          <input className="pg-input" defaultValue="Esme" id="fv-first" name="person.name.first" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fv-last">person.name.last</label>
          <input className="pg-input" defaultValue="Weatherwax" id="fv-last" name="person.name.last" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fv-city">person.city</label>
          <select className="pg-select" defaultValue="lancre" id="fv-city" name="person.city">
            <option value="ankh-morpork">Ankh-Morpork</option>
            <option value="lancre">Lancre</option>
            <option value="quirm">Quirm</option>
            <option value="sto-lat">Sto Lat</option>
          </select>
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fv-guild">person.guild</label>
          <select className="pg-select" defaultValue="witches" id="fv-guild" name="person.guild">
            <option value="watchman">watchman</option>
            <option value="witches">witches</option>
            <option value="assassins">assassins</option>
            <option value="thieves">thieves</option>
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
          <label className="pg-check-label">
            <input name="person.tags[]" type="checkbox" value="crime" />crime
          </label>
        </fieldset>
        <label className="pg-check-label" style={{ marginBottom: "1rem" }}>
          <input name="person.approved" type="checkbox" value="true" />person.approved
        </label>
        <div className="pg-btns">
          <button className="pg-btn" type="submit">Run @form2js/dom</button>
          <button className="pg-btn pg-btn-secondary" onClick={handleReset} type="button">Reset</button>
        </div>
      </form>
      <div style={{ marginTop: "0.75rem" }}>
        <button className="pg-btn pg-btn-secondary" onClick={handleLegacyRun} type="button">
          Run form2js() (legacy)
        </button>
      </div>
    </section>
  );
}

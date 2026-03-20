// apps/docs/src/components/playground/variants/form-data-variant.tsx
import React, { useRef } from "react";
import { formDataToObject } from "@form2js/form-data";

import type { StandardOutputState, VariantComponentProps } from "../types";

function createIdleState(): StandardOutputState {
  return { kind: "standard", status: "idle", statusMessage: "Ready to parse form data.", errorMessage: null, parsedPayload: null };
}

function createSuccessState(parsedPayload: unknown): StandardOutputState {
  return { kind: "standard", status: "success", statusMessage: "@form2js/form-data -> formDataToObject(form)", errorMessage: null, parsedPayload };
}

export function FormDataVariant({ onOutputChange }: VariantComponentProps): React.JSX.Element {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = formRef.current;
    if (!form) { onOutputChange(createIdleState()); return; }
    onOutputChange(createSuccessState(formDataToObject(new FormData(form))));
  }

  function handleReset(): void {
    formRef.current?.reset();
    onOutputChange(createIdleState());
  }

  return (
    <section aria-label="FormData variant">
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fd-first">person.name.first</label>
          <input className="pg-input" defaultValue="Tiffany" id="fd-first" name="person.name.first" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fd-last">person.name.last</label>
          <input className="pg-input" defaultValue="Aching" id="fd-last" name="person.name.last" type="text" />
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fd-city">person.city</label>
          <select className="pg-select" defaultValue="quirm" id="fd-city" name="person.city">
            <option value="ankh-morpork">Ankh-Morpork</option>
            <option value="lancre">Lancre</option>
            <option value="quirm">Quirm</option>
            <option value="sto-lat">Sto Lat</option>
          </select>
        </div>
        <div className="pg-field">
          <label className="pg-label" htmlFor="fd-guild">person.guild</label>
          <select className="pg-select" defaultValue="witches" id="fd-guild" name="person.guild">
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
            <input name="person.tags[]" type="checkbox" value="shepherding" />shepherding
          </label>
        </fieldset>
        <div className="pg-btns">
          <button className="pg-btn" type="submit">Run @form2js/form-data</button>
          <button className="pg-btn pg-btn-secondary" onClick={handleReset} type="button">Reset</button>
        </div>
      </form>
    </section>
  );
}

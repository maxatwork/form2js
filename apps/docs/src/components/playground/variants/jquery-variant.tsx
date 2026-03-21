// apps/docs/src/components/playground/variants/jquery-variant.tsx
import React, { useEffect, useRef } from "react";
import $ from "jquery";

import { ensureJqueryBootstrap } from "../bootstrap/jquery-bootstrap";
import type { StandardOutputState, VariantComponentProps } from "../types";

type JQueryToObjectOptions = { mode?: "first" | "all" | "combine" };
type JQueryCollectionWithToObject = JQuery & {
  toObject?: (options?: JQueryToObjectOptions) => unknown;
};

function createIdleState(): StandardOutputState {
  return { kind: "standard", status: "idle", statusMessage: "Ready to run the plugin.", errorMessage: null, parsedPayload: null };
}

function createSuccessState(statusMessage: string, parsedPayload: unknown): StandardOutputState {
  return { kind: "standard", status: "success", statusMessage, errorMessage: null, parsedPayload };
}

function getParsedPayload(
  root: HTMLDivElement,
  mode: "first" | "all" | "combine"
): unknown {
  const collection = $(root).find(".jq-slice") as JQueryCollectionWithToObject;
  return collection.toObject?.({ mode }) ?? null;
}

export function JQueryVariant({ onOutputChange }: VariantComponentProps): React.JSX.Element {
  const sourceRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLSelectElement>(null);

  useEffect(() => { ensureJqueryBootstrap(); }, []);

  function handleRun(): void {
    ensureJqueryBootstrap();
    const root = sourceRef.current;
    const mode = (modeRef.current?.value ?? "combine") as "first" | "all" | "combine";
    if (!root) return;
    const parsedPayload = getParsedPayload(root, mode);
    onOutputChange(createSuccessState(`@form2js/jquery -> $(".jq-slice").toObject({ mode: "${mode}" })`, parsedPayload));
  }

  function handleReset(): void {
    const root = sourceRef.current;
    if (root) {
      root.querySelectorAll<HTMLFormElement>("form").forEach((form) => {
        form.reset();
      });
    }
    onOutputChange(createIdleState());
  }

  return (
    <section aria-label="jQuery variant">
      <div ref={sourceRef}>
        <form className="jq-slice">
          <div className="pg-field">
            <label className="pg-label">person.first</label>
            <input className="pg-input" defaultValue="Gytha" name="person.first" type="text" />
          </div>
          <div className="pg-field">
            <label className="pg-label">person.last</label>
            <input className="pg-input" defaultValue="Ogg" name="person.last" type="text" />
          </div>
        </form>
        <form className="jq-slice">
          <div className="pg-field">
            <label className="pg-label">person.city</label>
            <select className="pg-select" defaultValue="lancre" name="person.city">
              <option value="ankh-morpork">Ankh-Morpork</option>
              <option value="lancre">Lancre</option>
              <option value="quirm">Quirm</option>
            </select>
          </div>
          <div className="pg-field">
            <label className="pg-label">person.guild</label>
            <select className="pg-select" defaultValue="witches" name="person.guild">
              <option value="watchman">watchman</option>
              <option value="witches">witches</option>
              <option value="assassins">assassins</option>
            </select>
          </div>
        </form>
      </div>
      <div className="pg-field" style={{ marginTop: "0.75rem" }}>
        <label className="pg-label" htmlFor="jq-mode">Mode</label>
        <select className="pg-select" defaultValue="combine" id="jq-mode" name="jquery-mode" ref={modeRef}>
          <option value="first">first</option>
          <option value="all">all</option>
          <option value="combine">combine</option>
        </select>
      </div>
      <div className="pg-btns">
        <button className="pg-btn" onClick={handleRun} type="button">Run @form2js/jquery</button>
        <button className="pg-btn pg-btn-secondary" onClick={handleReset} type="button">Reset</button>
      </div>
    </section>
  );
}

// apps/docs/src/components/playground/variants/core-variant.tsx
import React, { useRef } from "react";
import { entriesToObject } from "@form2js/core";

import type { StandardOutputState, VariantComponentProps } from "../types";

const INITIAL_ENTRIES_JSON = `[
  { "key": "person.name.first", "value": "Moist" },
  { "key": "person.name.last", "value": "von Lipwig" },
  { "key": "person.city", "value": "ankh-morpork" },
  { "key": "person.guild", "value": "thieves" },
  { "key": "person.tags[]", "value": "crime" },
  { "key": "person.tags[]", "value": "banking" }
]`;

function createErrorState(message: string): StandardOutputState {
  return { kind: "standard", status: "error", statusMessage: "core parse failed.", errorMessage: message, parsedPayload: null };
}

function createSuccessState(parsedPayload: unknown): StandardOutputState {
  return { kind: "standard", status: "success", statusMessage: "@form2js/core -> entriesToObject(entry objects)", errorMessage: null, parsedPayload };
}

function formatVariantError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function CoreVariant({ onOutputChange }: VariantComponentProps): React.JSX.Element {
  const jsonInputRef = useRef<HTMLTextAreaElement>(null);

  function handleRun(): void {
    const jsonInput = jsonInputRef.current;
    if (!jsonInput) return;

    let parsed: { key: string; value: unknown }[];

    try {
      parsed = JSON.parse(jsonInput.value) as { key: string; value: unknown }[];
    } catch {
      onOutputChange(createErrorState("JSON parse error: please provide valid entry-object JSON before parsing core entries."));
      return;
    }

    try {
      onOutputChange(createSuccessState(entriesToObject(parsed)));
    } catch (error: unknown) {
      onOutputChange(createErrorState(`Core conversion failed: ${formatVariantError(error)}`));
    }
  }

  return (
    <section aria-label="Core variant">
      <div className="pg-field">
        <label className="pg-label" htmlFor="core-entries">entry objects</label>
        <textarea
          className="pg-textarea"
          defaultValue={INITIAL_ENTRIES_JSON}
          id="core-entries"
          name="core-entries-json"
          ref={jsonInputRef}
          rows={10}
        />
      </div>
      <div className="pg-btns">
        <button className="pg-btn" onClick={handleRun} type="button">Run @form2js/core</button>
      </div>
    </section>
  );
}

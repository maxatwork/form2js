import React from "react";

import type { ReactOutputState } from "./types";

interface ReactInspectorPanelProps {
  outputState: ReactOutputState;
}

export function ReactInspectorPanel({ outputState }: ReactInspectorPanelProps): React.JSX.Element {
  const metaEntries = outputState.meta ? Object.entries(outputState.meta) : [];
  const hasParsedPayload = outputState.parsedPayload !== null;

  return (
    <section aria-label="React output">
      <h2>Submit state</h2>
      <p>{outputState.statusMessage}</p>
      <p>isSubmitting: {String(outputState.submitFlags.isSubmitting)}</p>
      <p>isError: {String(outputState.submitFlags.isError)}</p>
      <p>isSuccess: {String(outputState.submitFlags.isSuccess)}</p>
      {metaEntries.length > 0 ? (
        <dl>
          {metaEntries.map(([key, value]) => (
            <React.Fragment key={key}>
              <dt>{key}</dt>
              <dd>{value === null ? "null" : typeof value === "boolean" ? String(value) : value}</dd>
            </React.Fragment>
          ))}
        </dl>
      ) : null}
      {hasParsedPayload ? <pre>{JSON.stringify(outputState.parsedPayload, null, 2)}</pre> : null}
      {outputState.error ? <p>{outputState.error.message}</p> : null}
    </section>
  );
}

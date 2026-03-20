// apps/docs/src/components/playground/ResultPanel.tsx
import React from "react";
import type { OutputState } from "./types";

interface ResultPanelProps {
  outputState: OutputState;
}

function formatZodErrors(error: { message: string }): string[] {
  // The error message from react-variant is pre-formatted as "path: msg\npath: msg"
  return error.message.split("\n").filter(Boolean);
}

export function ResultPanel({ outputState }: ResultPanelProps): React.JSX.Element {
  const statusClass = `status-${outputState.status}`;

  if (outputState.kind === "react") {
    const { submitFlags, error, parsedPayload, meta } = outputState;
    const errorLines = error ? formatZodErrors(error) : [];
    const metaEntries = meta ? Object.entries(meta) : [];

    return (
      <div>
        <p className="result-eyebrow">Output</p>
        <h2>Submit state</h2>
        <span className={`status-badge ${statusClass}`}>
          {outputState.statusMessage}
        </span>
        <div className="result-flags">
          <span className="flag-key">isSubmitting</span>
          <span className={submitFlags.isSubmitting ? "flag-true" : "flag-false"}>
            {String(submitFlags.isSubmitting)}
          </span>
          <span className="flag-key">isError</span>
          <span className={submitFlags.isError ? "flag-true" : "flag-false"}>
            {String(submitFlags.isError)}
          </span>
          <span className="flag-key">isSuccess</span>
          <span className={submitFlags.isSuccess ? "flag-true" : "flag-false"}>
            {String(submitFlags.isSuccess)}
          </span>
        </div>
        {metaEntries.length > 0 && (
          <dl>
            {metaEntries.map(([key, value]) => (
              <React.Fragment key={key}>
                <dt>{key}</dt>
                <dd>{value === null ? "null" : typeof value === "boolean" ? String(value) : value}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {errorLines.length > 0 && (
          <div className="result-errors">
            {errorLines.map((line, i) => (
              <p key={i} className="result-error-item">
                {line}
              </p>
            ))}
          </div>
        )}
        {parsedPayload !== null ? (
          <pre className="result-json">{JSON.stringify(parsedPayload, null, 2)}</pre>
        ) : (
          <p className="result-empty">
            {outputState.status === "idle" ? "Submit the form to see parsed output." : ""}
          </p>
        )}
      </div>
    );
  }

  // standard kind
  const { errorMessage, parsedPayload, statusMessage } = outputState;
  return (
    <div>
      <p className="result-eyebrow">Output</p>
      <h2>Parsed result</h2>
      <span className={`status-badge ${statusClass}`}>{statusMessage}</span>
      {errorMessage && (
        <div className="result-errors">
          <p className="result-error-item">{errorMessage}</p>
        </div>
      )}
      {parsedPayload !== null ? (
        <pre className="result-json">{JSON.stringify(parsedPayload, null, 2)}</pre>
      ) : (
        <p className="result-empty">
          {outputState.status === "idle" ? "Run the variant to see parsed output." : ""}
        </p>
      )}
    </div>
  );
}

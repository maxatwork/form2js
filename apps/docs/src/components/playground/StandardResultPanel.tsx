import React from "react";

import type { StandardOutputState } from "./types";

interface StandardResultPanelProps {
  outputState: StandardOutputState;
}

export function StandardResultPanel({ outputState }: StandardResultPanelProps): React.JSX.Element {
  const hasParsedPayload = outputState.parsedPayload !== null;

  return (
    <section aria-label="Standard output">
      <h2>Parsed result</h2>
      <p>{outputState.statusMessage}</p>
      {outputState.errorMessage ? <p>{outputState.errorMessage}</p> : null}
      {hasParsedPayload ? <pre>{JSON.stringify(outputState.parsedPayload, null, 2)}</pre> : null}
    </section>
  );
}

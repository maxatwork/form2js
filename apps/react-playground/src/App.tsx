import { useState } from "react";
import { z } from "zod";
import { useForm2js } from "@form2js/react";

const SubmitPayloadSchema = z.object({
  person: z.object({
    name: z.object({
      first: z.string().min(1, "First name is required."),
      last: z.string().min(1, "Last name is required.")
    }),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email must be valid."),
    age: z.coerce.number().int().min(18, "Age must be at least 18."),
    interests: z.array(z.string()).default([])
  })
});

type SubmitPayload = z.infer<typeof SubmitPayloadSchema>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("\n");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function App(): React.JSX.Element {
  const [simulateRequestFailure, setSimulateRequestFailure] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<SubmitPayload | null>(null);

  const { onSubmit, isSubmitting, isError, error, isSuccess, reset } = useForm2js(
    async (data: SubmitPayload) => {
      await sleep(650);

      if (simulateRequestFailure) {
        throw new Error("Simulated request failure. Disable it and submit again.");
      }

      setLastSubmittedData(data);
    },
    {
      schema: SubmitPayloadSchema
    }
  );

  const resetView = (): void => {
    reset();
    setLastSubmittedData(null);
  };

  let statusHeadline = "Waiting for submit";
  let statusDetail =
    "form2js turns nested field names into structured data, runs schema validation, and keeps React submit state explicit.";

  if (isSubmitting) {
    statusHeadline = "Callback running";
    statusDetail = "Submit intercepted. FormData parsed, schema validated, callback pending.";
  } else if (isError) {
    statusHeadline = "Submit failed";
    statusDetail = "Submit intercepted. Validation or callback returned an error.";
  } else if (isSuccess) {
    statusHeadline = "Callback resolved";
    statusDetail = "Submit intercepted. FormData parsed, schema validated, callback resolved.";
  }

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero__copy">
          <p className="hero__eyebrow">@form2js/react</p>
          <h1 className="hero__title">React Playground</h1>
          <p className="hero__lede">Keep the form. Skip the manual parsing.</p>
          <p className="hero__desc">
            <code>useForm2js</code> converts nested field names into structured data, runs schema validation, and gives
            your React form a clean async state model without hand-written submit plumbing.
          </p>
        </div>

        <section className="hero__flow" aria-labelledby="how-it-works-heading">
          <p className="hero__kicker">How It Works</p>
          <h2 id="how-it-works-heading" className="hero__flowTitle">
            Hook lifecycle
          </h2>
          <div className="flow-list">
            <div className="flow-step">
              <span className="flow-step__index">1</span>
              <div>
                <strong>Submit intercepted</strong>
                <p>Prevent default and capture the form event.</p>
              </div>
            </div>
            <div className="flow-step">
              <span className="flow-step__index">2</span>
              <div>
                <strong>FormData parsed</strong>
                <p>Nested names become structured object data.</p>
              </div>
            </div>
            <div className="flow-step">
              <span className="flow-step__index">3</span>
              <div>
                <strong>Schema validated</strong>
                <p>Zod transforms and rejects invalid payloads.</p>
              </div>
            </div>
            <div className="flow-step">
              <span className="flow-step__index">4</span>
              <div>
                <strong>Callback resolved</strong>
                <p>Success and result panels update immediately.</p>
              </div>
            </div>
          </div>
        </section>
      </header>

      <main className="layout">
        <section className="card card--form">
          <div className="section-head">
            <div>
              <p className="section-head__eyebrow">Live Form</p>
              <h2 className="card__title">Form Input</h2>
            </div>
            <p className="section-head__copy">
              Keep ordinary form controls and nested `name` attributes, then let form2js produce the object your
              callback actually wants.
            </p>
          </div>
          <form
            onSubmit={(event) => {
              void onSubmit(event);
            }}
            className="form-grid"
          >
            <label className="field">
              <span className="field__label">person.name.first</span>
              <input name="person.name.first" type="text" defaultValue="Sam" />
            </label>

            <label className="field">
              <span className="field__label">person.name.last</span>
              <input name="person.name.last" type="text" defaultValue="Vimes" />
            </label>

            <label className="field">
              <span className="field__label">person.email</span>
              <input name="person.email" type="email" defaultValue="sam.vimes@ankh.city" />
            </label>

            <label className="field">
              <span className="field__label">person.age</span>
              <input name="person.age" type="number" min={0} defaultValue={45} />
            </label>

            <fieldset className="field field--checks">
              <legend className="field__label">person.interests[]</legend>
              <div className="checkbox-grid">
                <label className="check-card">
                  <input type="checkbox" name="person.interests[]" value="city-watch" defaultChecked />
                  <span className="check-card__box" aria-hidden="true"></span>
                  <span className="check-card__label">city-watch</span>
                </label>
                <label className="check-card">
                  <input type="checkbox" name="person.interests[]" value="cigars" defaultChecked />
                  <span className="check-card__box" aria-hidden="true"></span>
                  <span className="check-card__label">cigars</span>
                </label>
                <label className="check-card">
                  <input type="checkbox" name="person.interests[]" value="headology" />
                  <span className="check-card__box" aria-hidden="true"></span>
                  <span className="check-card__label">headology</span>
                </label>
              </div>
            </fieldset>

            <div className="test-control">
              <div>
                <p className="test-control__eyebrow">Testing Control</p>
                <p className="test-control__copy">
                  Flip the request path into failure mode so you can inspect how the hook surfaces callback errors.
                </p>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={simulateRequestFailure}
                  onChange={(event) => {
                    setSimulateRequestFailure(event.currentTarget.checked);
                  }}
                />
                <span className="toggle__switch" aria-hidden="true"></span>
                <span>{simulateRequestFailure ? "Failure mode on" : "Simulate request failure"}</span>
              </label>
            </div>

            <div className="actions">
              <button className="btn btn--primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button className="btn btn--ghost" type="button" onClick={resetView}>
                Reset state
              </button>
            </div>
          </form>
        </section>

        <section className="card card--inspector">
          <div className="inspector-hero">
            <p className="section-head__eyebrow">Live Inspector</p>
            <h2 className="card__title">What the hook returns in real time</h2>
            <p className="inspector-hero__summary">{statusHeadline}</p>
            <p className="inspector-hero__detail">{statusDetail}</p>
          </div>

          <section className="inspector-panel">
            <div className="inspector-panel__head">
              <h3 className="subhead">Live Hook State</h3>
              <span className="inspector-panel__meta">state machine</span>
            </div>
            <div className="state-grid">
              <span className={`state-chip ${isSubmitting ? "state-chip--on" : ""}`}>
                isSubmitting: {String(isSubmitting)}
              </span>
              <span className={`state-chip ${isError ? "state-chip--error" : ""}`}>isError: {String(isError)}</span>
              <span className={`state-chip ${isSuccess ? "state-chip--success" : ""}`}>
                isSuccess: {String(isSuccess)}
              </span>
            </div>
          </section>

          <section className="inspector-panel">
            <div className="inspector-panel__head">
              <h3 className="subhead">Validation / Error Output</h3>
              <span className="inspector-panel__meta">schema + callback</span>
            </div>
            <pre className="panel panel--light">{isError ? formatError(error) : "none"}</pre>
          </section>

          <section className="inspector-panel">
            <div className="inspector-panel__head">
              <h3 className="subhead">Parsed Result</h3>
              <span className="inspector-panel__meta">validated payload</span>
            </div>
            <pre className="panel panel--dark">
              {lastSubmittedData ? JSON.stringify(lastSubmittedData, null, 2) : "// submit to see validated payload"}
            </pre>
          </section>

          <section className="inspector-panel inspector-panel--sequence">
            <div className="inspector-panel__head">
              <h3 className="subhead">Lifecycle Summary</h3>
              <span className="inspector-panel__meta">event sequence</span>
            </div>
            <div className="sequence-list">
              <span className="sequence-item">Submit intercepted</span>
              <span className="sequence-item">FormData parsed</span>
              <span className="sequence-item">Schema validated</span>
              <span className="sequence-item">Callback resolved</span>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

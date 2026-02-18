import $ from "jquery";
import { entriesToObject } from "@form2js/core";
import { form2js, formToObject } from "@form2js/dom";
import { formDataToObject } from "@form2js/form-data";
import { installToObjectPlugin } from "@form2js/jquery";
import { objectToForm } from "@form2js/js2form";
import "./styles.css";

type JQueryToObjectOptions = { mode?: "first" | "all" | "combine" };
type JQueryCollectionWithToObject = JQuery & {
  toObject?: (options?: JQueryToObjectOptions) => unknown;
};

function requireElement(selector: string): Element {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Missing element ${selector}`);
  }

  return element;
}

installToObjectPlugin($);

const app = requireElement("#app") as HTMLDivElement;

app.innerHTML = `
  <div class="app-shell">
    <div class="accent-line" aria-hidden="true"></div>

    <header class="app-header">
      <div class="app-header__brand">
        <span class="app-header__logo">f2j</span>
        <span class="app-header__name">form2js</span>
        <span class="app-header__tag">playground</span>
      </div>
      <p class="app-header__desc">
        Dot-notation form parsing &mdash; pick a method, inspect the output.
      </p>
    </header>

    <div class="ide-layout">

      <div class="panel panel--left">
        <div class="panel__chrome">
          <div class="panel__dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <span class="panel__title">form-fields.html</span>
        </div>

        <nav class="tab-bar" role="tablist">
          <button class="tab tab--active" role="tab" data-tab="form" aria-selected="true">Form</button>
          <button class="tab" role="tab" data-tab="jquery" aria-selected="false">jQuery</button>
          <button class="tab" role="tab" data-tab="js2form" aria-selected="false">js2form</button>
        </nav>

        <div class="tab-panel tab-panel--active" data-tab-content="form">
          <form id="profile-form" class="form-fields">
            <div class="form-field">
              <label for="first" class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment">name</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">first</span>
              </label>
              <input id="first" type="text" name="person.name.first" value="Esme" />
            </div>

            <div class="form-field">
              <label for="last" class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment">name</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">last</span>
              </label>
              <input id="last" type="text" name="person.name.last" value="Weatherwax" />
            </div>

            <div class="form-field">
              <label for="city" class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">city</span>
              </label>
              <select id="city" name="person.city">
                <option value="ankh-morpork">Ankh-Morpork</option>
                <option value="lancre" selected>Lancre</option>
                <option value="quirm">Quirm</option>
              </select>
            </div>

            <div class="form-field form-field--checks">
              <span class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">tags[]</span>
              </span>
              <div class="check-group">
                <label class="check-item"><input type="checkbox" name="person.tags[]" value="witch" checked /><span>witch</span></label>
                <label class="check-item"><input type="checkbox" name="person.tags[]" value="headology" checked /><span>headology</span></label>
              </div>
            </div>

            <div class="form-field form-field--checks">
              <span class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">approved</span>
              </span>
              <label class="check-item"><input type="checkbox" name="person.approved" value="true" /><span>approved</span></label>
            </div>
          </form>

          <div class="action-bar">
            <span class="action-bar__label">Run method:</span>
            <button id="run-dom" class="action-btn action-btn--primary">
              <span class="action-btn__pkg">@form2js/dom</span>
            </button>
            <button id="run-legacy" class="action-btn">
              <span class="action-btn__pkg">form2js()</span>
              <span class="action-btn__badge">compat</span>
            </button>
            <button id="run-formdata" class="action-btn">
              <span class="action-btn__pkg">@form2js/form-data</span>
            </button>
            <button id="run-core" class="action-btn">
              <span class="action-btn__pkg">@form2js/core</span>
            </button>
          </div>
        </div>

        <div class="tab-panel" data-tab-content="jquery">
          <div id="jquery-sources" class="form-fields">
            <form class="jq-slice form-field">
              <label class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">first</span>
              </label>
              <input type="text" name="person.first" value="Sam" />
            </form>
            <form class="jq-slice form-field">
              <label class="field-path">
                <span class="path-segment">person</span><span class="path-dot">.</span><span class="path-segment path-segment--leaf">last</span>
              </label>
              <input type="text" name="person.last" value="Vimes" />
            </form>
          </div>
          <div class="action-bar">
            <label class="action-bar__inline" for="jq-mode">
              mode:
              <select id="jq-mode">
                <option value="first">first</option>
                <option value="all">all</option>
                <option value="combine" selected>combine</option>
              </select>
            </label>
            <button id="run-jquery" class="action-btn action-btn--primary">
              <span class="action-btn__pkg">@form2js/jquery</span>
            </button>
          </div>
        </div>

        <div class="tab-panel" data-tab-content="js2form">
          <div class="form-fields">
            <div class="form-field">
              <label for="json-input" class="field-path">
                <span class="path-segment path-segment--leaf">input.json</span>
              </label>
              <textarea id="json-input" rows="10">{
  "person": {
    "name": {
      "first": "Tiffany",
      "last": "Aching"
    },
    "city": "quirm",
    "tags": ["witch"]
  }
}</textarea>
            </div>
          </div>
          <div class="action-bar">
            <button id="run-js2form" class="action-btn action-btn--primary">
              <span class="action-btn__pkg">Apply js2form</span>
            </button>
            <button id="reset-form" class="action-btn action-btn--danger">
              <span class="action-btn__pkg">Reset form</span>
            </button>
          </div>
          <small class="status-note" id="status-note"></small>
        </div>
      </div>

      <div class="panel panel--right">
        <div class="panel__chrome">
          <div class="panel__dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <span class="panel__title">output.json</span>
          <span class="panel__method-badge" id="method-badge"></span>
        </div>
        <pre id="output" class="output-pane"><span class="output-hint">// Press a method button to generate output.</span></pre>
      </div>

    </div>
  </div>
`;

// --- Element references ---

const profileForm = requireElement("#profile-form") as HTMLFormElement;
const output = requireElement("#output") as HTMLPreElement;
const note = requireElement("#status-note") as HTMLElement;
const jsonInput = requireElement("#json-input") as HTMLTextAreaElement;
const jqMode = requireElement("#jq-mode") as HTMLSelectElement;

const initialFormMarkup = profileForm.innerHTML;

// --- JSON syntax highlighting ---

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightJSON(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*(:)|("(?:\\.|[^"\\])*")|([-+]?\d+\.?\d*(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([[\]{}])|([,:])/g,
    (
      _match: string,
      key: string | undefined,
      colon: string | undefined,
      str: string | undefined,
      num: string | undefined,
      bool: string | undefined,
      nul: string | undefined,
      brace: string | undefined,
      punct: string | undefined,
    ): string => {
      if (key && colon) {
        return `<span class="syn-key">${escapeHtml(key)}</span><span class="syn-colon">:</span>`;
      }
      if (str !== undefined) {
        return `<span class="syn-string">${escapeHtml(str)}</span>`;
      }
      if (num !== undefined) {
        return `<span class="syn-number">${num}</span>`;
      }
      if (bool !== undefined) {
        return `<span class="syn-bool">${bool}</span>`;
      }
      if (nul !== undefined) {
        return `<span class="syn-null">${nul}</span>`;
      }
      if (brace !== undefined) {
        return `<span class="syn-brace">${brace}</span>`;
      }
      if (punct !== undefined) {
        return `<span class="syn-colon">${punct}</span>`;
      }
      return escapeHtml(_match);
    },
  );
}

// --- Output helpers ---

function printResult(label: string, data: unknown): void {
  const json = JSON.stringify(data, null, 2);
  const highlighted = highlightJSON(json);

  const badge = document.getElementById("method-badge");
  if (badge) {
    badge.textContent = label.split("->")[0]?.trim() ?? label;
    badge.classList.add("visible");
  }

  output.innerHTML =
    `<span class="output-hint">// ${escapeHtml(label)}</span>\n` + highlighted;

  output.classList.remove("output-flash");
  void output.offsetWidth;
  output.classList.add("output-flash");

  note.textContent = "";
}

function printError(message: string): void {
  note.textContent = message;
}

// --- Method handlers ---

function runDomMethod(): void {
  const data = formToObject(profileForm);
  printResult("@form2js/dom -> formToObject(form)", data);
}

function runLegacyMethod(): void {
  const data = form2js(profileForm);
  printResult("@form2js/dom -> form2js(form)", data);
}

function runFormDataMethod(): void {
  const data = formDataToObject(new FormData(profileForm));
  printResult("@form2js/form-data -> formDataToObject(new FormData(form))", data);
}

function runCoreMethod(): void {
  const entries = [...new FormData(profileForm).entries()];
  const data = entriesToObject(entries.map(([key, value]) => ({ key, value })));
  printResult("@form2js/core -> entriesToObject(FormData entries)", data);
}

function runJqueryMethod(): void {
  const mode = jqMode.value as "first" | "all" | "combine";
  const data = ($(".jq-slice") as JQueryCollectionWithToObject).toObject?.({
    mode,
  });
  printResult(
    `@form2js/jquery -> $(".jq-slice").toObject({ mode: "${mode}" })`,
    data,
  );
}

function runJs2FormMethod(): void {
  try {
    const parsed = JSON.parse(jsonInput.value) as unknown;
    objectToForm(profileForm, parsed);

    const after = formToObject(profileForm);
    printResult(
      "@form2js/js2form -> objectToForm(...), then formToObject(...)",
      after,
    );
  } catch {
    printError(
      "JSON parse error: please provide valid JSON before applying js2form.",
    );
  }
}

function resetForm(): void {
  profileForm.innerHTML = initialFormMarkup;
  output.innerHTML =
    '<span class="output-hint">// Form reset. Pick a method to parse again.</span>';
  note.textContent = "";
  const badge = document.getElementById("method-badge");
  if (badge) {
    badge.textContent = "";
    badge.classList.remove("visible");
  }
}

// --- Tab switching ---

function initTabs(): void {
  const tabs = document.querySelectorAll<HTMLElement>(".tab");
  const panels = document.querySelectorAll<HTMLElement>(".tab-panel");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      if (!target) return;

      tabs.forEach((t) => {
        t.classList.toggle("tab--active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });

      panels.forEach((p) => {
        p.classList.toggle(
          "tab-panel--active",
          p.dataset.tabContent === target,
        );
      });
    });
  });
}

// --- Event binding ---

const byId = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Missing element #${id}`);
  }

  return el;
};

byId("run-dom").addEventListener("click", runDomMethod);
byId("run-legacy").addEventListener("click", runLegacyMethod);
byId("run-formdata").addEventListener("click", runFormDataMethod);
byId("run-core").addEventListener("click", runCoreMethod);
byId("run-jquery").addEventListener("click", runJqueryMethod);
byId("run-js2form").addEventListener("click", runJs2FormMethod);
byId("reset-form").addEventListener("click", resetForm);

initTabs();
runDomMethod();

import { SKIP_NODE, form2js, formToObject } from "./index";

interface DomStandaloneGlobals {
  formToObject?: typeof formToObject;
  form2js?: typeof form2js;
  SKIP_NODE?: typeof SKIP_NODE;
}

const scope = globalThis as typeof globalThis & DomStandaloneGlobals;

scope.formToObject = formToObject;
scope.form2js = form2js;
scope.SKIP_NODE = SKIP_NODE;

export { SKIP_NODE, form2js, formToObject };

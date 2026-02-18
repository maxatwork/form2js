import { form2js, formToObject } from "./index";

interface DomStandaloneGlobals {
  formToObject?: typeof formToObject;
  form2js?: typeof form2js;
}

const scope = globalThis as typeof globalThis & DomStandaloneGlobals;

scope.formToObject = formToObject;
scope.form2js = form2js;

export { form2js, formToObject };

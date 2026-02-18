import {
  entriesToObject as coreEntriesToObject,
  type EntryInput,
  type ObjectTree,
  type ParseOptions
} from "@form2js/core";

export type KeyValueEntryInput = EntryInput;

export interface FormDataToObjectOptions extends ParseOptions {}

export function entriesToObject(entries: Iterable<KeyValueEntryInput>, options: ParseOptions = {}): ObjectTree {
  return coreEntriesToObject(entries, options);
}

export function formDataToObject(
  formData: FormData | Iterable<readonly [string, FormDataEntryValue]>,
  options: FormDataToObjectOptions = {}
): ObjectTree {
  const entries =
    formData instanceof FormData ? formData.entries() : formData;

  return coreEntriesToObject(entries, options);
}

export type { EntryInput, ObjectTree, ParseOptions } from "@form2js/core";

import {
  entriesToObject as coreEntriesToObject,
  type EntryInput,
  type InferSchemaOutput,
  type ObjectTree,
  type ParseOptions,
  type SchemaValidator,
  type ValidationOptions
} from "@form2js/core";

export type KeyValueEntryInput = EntryInput;

export interface FormDataToObjectOptions extends ParseOptions {}

export { entriesToObject } from "@form2js/core";

export function formDataToObject(
  formData: FormData | Iterable<readonly [string, FormDataEntryValue]>,
  options?: FormDataToObjectOptions
): ObjectTree;
export function formDataToObject<TSchema extends SchemaValidator>(
  formData: FormData | Iterable<readonly [string, FormDataEntryValue]>,
  options: FormDataToObjectOptions & { schema: TSchema }
): InferSchemaOutput<TSchema>;
export function formDataToObject(
  formData: FormData | Iterable<readonly [string, FormDataEntryValue]>,
  options: FormDataToObjectOptions & ValidationOptions = {}
): unknown {
  const entries =
    formData instanceof FormData ? formData.entries() : formData;

  return coreEntriesToObject(entries, options);
}

export type {
  EntryInput,
  InferSchemaOutput,
  ObjectTree,
  ParseOptions,
  SchemaValidator,
  ValidationOptions
} from "@form2js/core";

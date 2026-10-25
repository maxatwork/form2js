import type {
  Entry,
  EntryInput,
  EntryValue,
  InferSchemaOutput,
  MergeContext,
  MergeOptions,
  NameValuePair,
  ObjectTree,
  ParseOptions,
  SchemaValidator,
  ValidationOptions
} from "./types";

const SUB_ARRAY_REGEXP = /^\[\d+?\]/;
const SUB_OBJECT_REGEXP = /^[a-zA-Z_][a-zA-Z_0-9]*/;
const PATH_TOKEN_REGEXP = /[a-zA-Z_][a-zA-Z0-9_]*/g;
const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

interface BracketMatch {
  content: string;
  index: number;
  end: number;
}

function findBracketMatches(input: string): BracketMatch[] {
  const matches: BracketMatch[] = [];
  let cursor = 0;

  // Stop at the first unmatched opening bracket instead of rescanning its suffix.
  while (cursor < input.length) {
    const index = input.indexOf("[", cursor);
    if (index === -1) break;
    const end = input.indexOf("]", index + 1);
    if (end === -1) break;

    matches.push({ content: input.slice(index + 1, end), index, end: end + 1 });
    cursor = end + 1;
  }

  return matches;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createIndexRecord(): Record<string, unknown> {
  return Object.create(null) as Record<string, unknown>;
}

function hasOwnRecordValue(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function getOwnRecordValue(record: Record<string, unknown>, key: string): unknown {
  return hasOwnRecordValue(record, key) ? record[key] : undefined;
}

function setOwnRecordValue(record: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(record, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true
  });
}

function normalizeEntry(entry: EntryInput): Entry {
  if (Array.isArray(entry) && typeof entry[0] === "string") {
    const tupleEntry = entry as readonly [string, EntryValue];
    return { key: tupleEntry[0], value: tupleEntry[1] };
  }

  if ("key" in entry && typeof entry.key === "string") {
    return { key: entry.key, value: entry.value };
  }

  if ("name" in entry && typeof entry.name === "string") {
    return { key: entry.name, value: entry.value };
  }

  throw new TypeError("Invalid entry. Expected [key, value], { key, value }, or { name, value }.");
}

function shouldSkipValue(value: EntryValue, skipEmpty: boolean): boolean {
  return skipEmpty && (value === "" || value === null);
}

function findUnsafePathToken(part: string): string | null {
  const tokens = part.match(PATH_TOKEN_REGEXP);
  if (!tokens) {
    return null;
  }

  for (const token of tokens) {
    if (UNSAFE_PATH_SEGMENTS.has(token)) {
      return token;
    }
  }

  return null;
}

function assertPathIsSafe(nameParts: string[], allowUnsafePathSegments: boolean): void {
  if (allowUnsafePathSegments) {
    return;
  }

  for (const namePart of nameParts) {
    const unsafeToken = findUnsafePathToken(namePart);
    if (unsafeToken) {
      throw new TypeError(
        `Unsafe path segment "${unsafeToken}" is not allowed. ` +
          "Pass allowUnsafePathSegments: true only for trusted input."
      );
    }
  }
}

function splitNameIntoParts(name: string, delimiter: string): string[] {
  const rawParts = name.split(delimiter);
  const nameParts: string[] = [];

  for (const rawPart of rawParts) {
    const bracketMatches = findBracketMatches(rawPart);
    if (bracketMatches.length === 0) {
      nameParts.push(rawPart);
      continue;
    }

    let currentPart = "";
    let cursor = 0;

    for (const match of bracketMatches) {
      const literalText = rawPart.slice(cursor, match.index);
      if (literalText !== "") {
        currentPart += literalText;
      }

      const bracketContent = match.content;
      const isArraySegment = bracketContent === "" || /^\d+$/.test(bracketContent);

      if (isArraySegment) {
        if (currentPart !== "" && currentPart.endsWith("]")) {
          nameParts.push(currentPart);
          currentPart = "";
        }

        currentPart = `${currentPart}[${bracketContent}]`;
      } else {
        if (currentPart !== "") {
          nameParts.push(currentPart);
        }

        currentPart = bracketContent;
      }

      cursor = match.end;
    }

    const trailingText = rawPart.slice(cursor);
    if (trailingText !== "") {
      currentPart += trailingText;
    }

    if (currentPart !== "") {
      nameParts.push(currentPart);
    }
  }

  return nameParts;
}

function ensureNamedArray(container: unknown, arrayName: string): unknown[] {
  if (arrayName === "" && Array.isArray(container)) {
    return container;
  }

  if (!isRecord(container)) {
    throw new TypeError("Expected object-like container when creating array path");
  }

  const existingValue = getOwnRecordValue(container, arrayName);
  if (Array.isArray(existingValue)) {
    return existingValue;
  }

  const newArray: unknown[] = [];
  setOwnRecordValue(container, arrayName, newArray);
  return newArray;
}

function pushToNamedArray(container: unknown, arrayName: string, value: unknown): unknown {
  const targetArray = ensureNamedArray(container, arrayName);
  targetArray.push(value);
  return targetArray[targetArray.length - 1];
}

const arrayKeys = new WeakMap<unknown[], string>();
let nextArrayKey = 0;

// Key index maps by array identity: path-derived keys can collide and grow with path depth.
function getArrayKey(array: unknown[]): string {
  let key = arrayKeys.get(array);
  if (key === undefined) {
    key = String(nextArrayKey);
    nextArrayKey += 1;
    arrayKeys.set(array, key);
  }

  return key;
}

export function createMergeContext(): MergeContext {
  return { arrays: createIndexRecord() as MergeContext["arrays"] };
}

export function setPathValue(
  target: ObjectTree,
  path: string,
  value: EntryValue,
  options: MergeOptions = {}
): ObjectTree {
  const delimiter = options.delimiter ?? ".";
  const context = options.context ?? createMergeContext();
  const allowUnsafePathSegments = options.allowUnsafePathSegments ?? false;
  const nameParts = splitNameIntoParts(path, delimiter);
  assertPathIsSafe(nameParts, allowUnsafePathSegments);

  let currResult: unknown = target;

  for (let partIndex = 0; partIndex < nameParts.length; partIndex += 1) {
    const namePart = nameParts[partIndex] ?? "";
    const isLast = partIndex === nameParts.length - 1;

    if (namePart.includes("[]") && isLast) {
      const arrayName = namePart.slice(0, namePart.indexOf("["));
      pushToNamedArray(currResult, arrayName, value);
      continue;
    }

    if (namePart.includes("[")) {
      const arrayName = namePart.slice(0, namePart.indexOf("["));
      const arrayIndex = namePart.replace(/(^([a-z_]+)?\[)|(\]$)/gi, "");

      const arrayKey = getArrayKey(ensureNamedArray(currResult, arrayName));

      const existingArrayMap = getOwnRecordValue(context.arrays, arrayKey);
      const arrayMap = isRecord(existingArrayMap) ? existingArrayMap : createIndexRecord();
      if (!isRecord(existingArrayMap)) {
        setOwnRecordValue(context.arrays, arrayKey, arrayMap);
      }

      if (isLast) {
        const inserted = pushToNamedArray(currResult, arrayName, value);
        setOwnRecordValue(arrayMap, arrayIndex, inserted);
      } else if (getOwnRecordValue(arrayMap, arrayIndex) === undefined) {
        const nextNamePart = nameParts[partIndex + 1] ?? "";
        const nextContainer = /^[0-9a-z_]+\[?/i.test(nextNamePart) ? {} : [];

        const inserted = pushToNamedArray(currResult, arrayName, nextContainer);
        setOwnRecordValue(arrayMap, arrayIndex, inserted);
      }

      currResult = getOwnRecordValue(arrayMap, arrayIndex);
      continue;
    }

    if (!isRecord(currResult)) {
      throw new TypeError("Expected object-like container while setting nested path");
    }

    if (!isLast) {
      if (getOwnRecordValue(currResult, namePart) === undefined) {
        setOwnRecordValue(currResult, namePart, {});
      }

      currResult = getOwnRecordValue(currResult, namePart);
    } else {
      setOwnRecordValue(currResult, namePart, value);
    }
  }

  return target;
}

export function entriesToObject(entries: Iterable<EntryInput>, options?: ParseOptions): ObjectTree;
export function entriesToObject<TSchema extends SchemaValidator>(
  entries: Iterable<EntryInput>,
  options: ParseOptions & { schema: TSchema }
): InferSchemaOutput<TSchema>;
export function entriesToObject(
  entries: Iterable<EntryInput>,
  options: ParseOptions & ValidationOptions = {}
): unknown {
  const delimiter = options.delimiter ?? ".";
  const skipEmpty = options.skipEmpty ?? true;
  const allowUnsafePathSegments = options.allowUnsafePathSegments ?? false;
  const context = createMergeContext();
  const result: ObjectTree = {};

  for (const rawEntry of entries) {
    const entry = normalizeEntry(rawEntry);

    if (shouldSkipValue(entry.value, skipEmpty)) {
      continue;
    }

    setPathValue(result, entry.key, entry.value, {
      delimiter,
      context,
      allowUnsafePathSegments
    });
  }

  if (options.schema) {
    return options.schema.parse(result);
  }

  return result;
}

function objectToNameValues(obj: unknown, delimiter: string): NameValuePair[] {
  const result: NameValuePair[] = [];

  if (obj === null || obj === undefined) {
    result.push({ name: "", value: null });
    return result;
  }

  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    result.push({ name: "", value: obj });
    return result;
  }

  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index += 1) {
      const name = `[${index}]`;
      result.push(...getSubValues(obj[index], name, delimiter));
    }
    return result;
  }

  if (isRecord(obj)) {
    for (const key of Object.keys(obj)) {
      result.push(...getSubValues(obj[key], key, delimiter));
    }
  }

  return result;
}

function getSubValues(subObject: unknown, name: string, delimiter: string): NameValuePair[] {
  const result: NameValuePair[] = [];
  const tempResult = objectToNameValues(subObject, delimiter);

  for (const item of tempResult) {
    let itemName = name;

    if (SUB_ARRAY_REGEXP.test(item.name)) {
      itemName += item.name;
    } else if (SUB_OBJECT_REGEXP.test(item.name)) {
      itemName += `${delimiter}${item.name}`;
    }

    result.push({ name: itemName, value: item.value });
  }

  return result;
}

export function objectToEntries(value: unknown, options: Pick<ParseOptions, "delimiter"> = {}): Entry[] {
  return objectToNameValues(value, options.delimiter ?? ".").map((item) => ({
    key: item.name,
    value: item.value
  }));
}

export function processNameValues(
  nameValues: Iterable<NameValuePair>,
  skipEmpty = true,
  delimiter = "."
): ObjectTree {
  const entries: Entry[] = [];

  for (const pair of nameValues) {
    entries.push({ key: pair.name, value: pair.value });
  }

  return entriesToObject(entries, { skipEmpty, delimiter });
}

export type {
  Entry,
  EntryInput,
  EntryValue,
  InferSchemaOutput,
  MergeContext,
  MergeOptions,
  NameValuePair,
  ObjectTree,
  ParseOptions,
  SchemaValidator,
  ValidationOptions
} from "./types";

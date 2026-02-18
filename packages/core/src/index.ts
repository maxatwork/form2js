import type {
  Entry,
  EntryInput,
  EntryValue,
  MergeContext,
  MergeOptions,
  NameValuePair,
  ObjectTree,
  ParseOptions
} from "./types";

const SUB_ARRAY_REGEXP = /^\[\d+?\]/;
const SUB_OBJECT_REGEXP = /^[a-zA-Z_][a-zA-Z_0-9]*/;
const PATH_TOKEN_REGEXP = /[a-zA-Z_][a-zA-Z0-9_]*/g;
const UNSAFE_PATH_SEGMENTS = new Set(["__proto__", "prototype", "constructor"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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
    const splitByRailsChunk = rawPart.split("][");

    if (splitByRailsChunk.length > 1) {
      for (let chunkIndex = 0; chunkIndex < splitByRailsChunk.length; chunkIndex += 1) {
        let chunk = splitByRailsChunk[chunkIndex] ?? "";

        if (chunkIndex === 0) {
          chunk = `${chunk}]`;
        } else if (chunkIndex === splitByRailsChunk.length - 1) {
          chunk = `[${chunk}`;
        } else {
          chunk = `[${chunk}]`;
        }

        const railsMatch = chunk.match(/([a-z_]+)?\[([a-z_][a-z0-9_]+?)\]/i);
        if (railsMatch) {
          for (let matchIndex = 1; matchIndex < railsMatch.length; matchIndex += 1) {
            const matchPart = railsMatch[matchIndex];
            if (matchPart) {
              nameParts.push(matchPart);
            }
          }
        } else {
          nameParts.push(chunk);
        }
      }
    } else {
      nameParts.push(...splitByRailsChunk);
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

  const existingValue = container[arrayName];
  if (Array.isArray(existingValue)) {
    return existingValue;
  }

  const newArray: unknown[] = [];
  container[arrayName] = newArray;
  return newArray;
}

function pushToNamedArray(container: unknown, arrayName: string, value: unknown): unknown {
  const targetArray = ensureNamedArray(container, arrayName);
  targetArray.push(value);
  return targetArray[targetArray.length - 1];
}

export function createMergeContext(): MergeContext {
  return { arrays: {} };
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
  let arrayNameFull = "";

  for (let partIndex = 0; partIndex < nameParts.length; partIndex += 1) {
    const namePart = nameParts[partIndex] ?? "";
    const isLast = partIndex === nameParts.length - 1;

    if (namePart.includes("[]") && isLast) {
      const arrayName = namePart.slice(0, namePart.indexOf("["));
      arrayNameFull += arrayName;

      pushToNamedArray(currResult, arrayName, value);
      continue;
    }

    if (namePart.includes("[")) {
      const arrayName = namePart.slice(0, namePart.indexOf("["));
      const arrayIndex = namePart.replace(/(^([a-z_]+)?\[)|(\]$)/gi, "");

      arrayNameFull += `_${arrayName}_${arrayIndex}`;

      if (arrayName !== "") {
        ensureNamedArray(currResult, arrayName);
      }

      const arrayMap = (context.arrays[arrayNameFull] ??= {});

      if (isLast) {
        const inserted = pushToNamedArray(currResult, arrayName, value);
        arrayMap[arrayIndex] = inserted;
      } else if (!arrayMap[arrayIndex]) {
        const nextNamePart = nameParts[partIndex + 1] ?? "";
        const nextContainer = /^[0-9a-z_]+\[?/i.test(nextNamePart) ? {} : [];

        const inserted = pushToNamedArray(currResult, arrayName, nextContainer);
        arrayMap[arrayIndex] = inserted;
      }

      currResult = arrayMap[arrayIndex];
      continue;
    }

    arrayNameFull += namePart;

    if (!isRecord(currResult)) {
      throw new TypeError("Expected object-like container while setting nested path");
    }

    if (!isLast) {
      if (!currResult[namePart]) {
        currResult[namePart] = {};
      }

      currResult = currResult[namePart];
    } else {
      currResult[namePart] = value;
    }
  }

  return target;
}

export function entriesToObject(entries: Iterable<EntryInput>, options: ParseOptions = {}): ObjectTree {
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

  return result;
}

function objectToNameValues(obj: unknown): NameValuePair[] {
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
      result.push(...getSubValues(obj[index], name));
    }
    return result;
  }

  if (isRecord(obj)) {
    for (const key of Object.keys(obj)) {
      result.push(...getSubValues(obj[key], key));
    }
  }

  return result;
}

function getSubValues(subObject: unknown, name: string): NameValuePair[] {
  const result: NameValuePair[] = [];
  const tempResult = objectToNameValues(subObject);

  for (const item of tempResult) {
    let itemName = name;

    if (SUB_ARRAY_REGEXP.test(item.name)) {
      itemName += item.name;
    } else if (SUB_OBJECT_REGEXP.test(item.name)) {
      itemName += `.${item.name}`;
    }

    result.push({ name: itemName, value: item.value });
  }

  return result;
}

export function objectToEntries(value: unknown): Entry[] {
  return objectToNameValues(value).map((item) => ({
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
  MergeContext,
  MergeOptions,
  NameValuePair,
  ObjectTree,
  ParseOptions
} from "./types";

import { objectToEntries, type Entry } from "@form2js/core";

const ARRAY_ITEM_REGEXP = /\[[0-9]+?\]$/;
const LAST_INDEXED_ARRAY_REGEXP = /(.*)(\[)([0-9]*)(\])$/;
const ARRAY_OF_ARRAYS_REGEXP = /\[([0-9]+)\]\[([0-9]+)\]/g;

export type RootNodeInput = string | Node | null | undefined;
export type ObjectToFormNodeCallback = ((node: Node) => unknown) | null | undefined;

export interface ObjectToFormOptions {
  delimiter?: string;
  nodeCallback?: ObjectToFormNodeCallback;
  useIdIfEmptyName?: boolean;
  shouldClean?: boolean;
  document?: Document;
}

export type SupportedField = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
export type SupportedFieldCollection = SupportedField | SupportedField[];
export type FieldMap = Record<string, SupportedFieldCollection>;

type ArrayIndexesMap = Record<
  string,
  {
    lastIndex: number;
    indexes: Record<string, number>;
  }
>;

function isNodeObject(value: unknown): value is Node {
  return typeof value === "object" && value !== null && "nodeType" in value && "nodeName" in value;
}

function isElementNode(node: Node): node is Element {
  return node.nodeType === 1;
}

function nodeNameIs(node: Node, expected: string): boolean {
  return node.nodeName.toUpperCase() === expected;
}

function isInputNode(node: Node): node is HTMLInputElement {
  return nodeNameIs(node, "INPUT");
}

function isTextareaNode(node: Node): node is HTMLTextAreaElement {
  return nodeNameIs(node, "TEXTAREA");
}

function isSelectNode(node: Node): node is HTMLSelectElement {
  return nodeNameIs(node, "SELECT");
}

function getDocumentFromRoot(rootNode: RootNodeInput, fallback?: Document): Document {
  if (fallback) {
    return fallback;
  }

  if (typeof document !== "undefined") {
    return document;
  }

  if (isNodeObject(rootNode) && rootNode.ownerDocument) {
    return rootNode.ownerDocument;
  }

  throw new Error("No document available. Provide options.document when running outside a browser.");
}

function resolveRootNode(rootNode: RootNodeInput, options: ObjectToFormOptions): Node | null {
  if (!rootNode) {
    return null;
  }

  if (typeof rootNode !== "string") {
    return isNodeObject(rootNode) ? rootNode : null;
  }

  const doc = getDocumentFromRoot(rootNode, options.document);
  return doc.getElementById(rootNode);
}

function isSupportedField(node: Node): node is SupportedField {
  return isInputNode(node) || isTextareaNode(node) || isSelectNode(node);
}

function normalizeName(name: string, delimiter: string, arrayIndexes: ArrayIndexesMap): string {
  const normalizedNameChunks: string[] = [];
  const chunks = name.replace(ARRAY_OF_ARRAYS_REGEXP, "[$1].[$2]").split(delimiter);

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
    const currentChunk = chunks[chunkIndex] ?? "";
    normalizedNameChunks.push(currentChunk);

    const nameMatches = currentChunk.match(LAST_INDEXED_ARRAY_REGEXP);
    if (!nameMatches) {
      continue;
    }

    let currentNormalizedName = normalizedNameChunks.join(delimiter);
    const currentIndex = currentNormalizedName.replace(LAST_INDEXED_ARRAY_REGEXP, "$3");
    currentNormalizedName = currentNormalizedName.replace(LAST_INDEXED_ARRAY_REGEXP, "$1");

    const arrayIndexInfo = (arrayIndexes[currentNormalizedName] ??= {
      lastIndex: -1,
      indexes: {}
    });

    if (currentIndex === "" || arrayIndexInfo.indexes[currentIndex] === undefined) {
      arrayIndexInfo.lastIndex += 1;
      arrayIndexInfo.indexes[currentIndex] = arrayIndexInfo.lastIndex;
    }

    const newIndex = arrayIndexInfo.indexes[currentIndex];
    normalizedNameChunks[normalizedNameChunks.length - 1] = currentChunk.replace(
      LAST_INDEXED_ARRAY_REGEXP,
      `$1$2${newIndex}$4`
    );
  }

  return normalizedNameChunks.join(delimiter).replace("].[", "][");
}

function mergeField(result: FieldMap, key: string, value: SupportedFieldCollection): void {
  const existing = result[key];

  if (!existing) {
    result[key] = value;
    return;
  }

  if (Array.isArray(existing)) {
    if (Array.isArray(value)) {
      existing.push(...value);
    } else {
      existing.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    result[key] = [existing, ...value];
    return;
  }

  result[key] = value;
}

function getFields(
  rootNode: Node,
  useIdIfEmptyName: boolean,
  delimiter: string,
  arrayIndexes: ArrayIndexesMap,
  shouldClean: boolean
): FieldMap {
  const result: FieldMap = {};
  let currentNode: ChildNode | null = rootNode.firstChild;

  while (currentNode) {
    let name = "";

    if (isElementNode(currentNode)) {
      const namedNode = currentNode as Element & { name?: string; id?: string };
      if (namedNode.name && namedNode.name !== "") {
        name = namedNode.name;
      } else if (useIdIfEmptyName && namedNode.id && namedNode.id !== "") {
        name = namedNode.id;
      }
    }

    if (name === "") {
      const subFields = getFields(currentNode, useIdIfEmptyName, delimiter, arrayIndexes, shouldClean);
      for (const [subFieldName, subFieldValue] of Object.entries(subFields)) {
        mergeField(result, subFieldName, subFieldValue);
      }
    } else if (isSelectNode(currentNode)) {
      const options = currentNode.getElementsByTagName("option");

      for (let optionIndex = 0; optionIndex < options.length; optionIndex += 1) {
        if (shouldClean) {
          const option = options[optionIndex];
          if (option) {
            option.selected = false;
          }
        }

        const normalizedName = normalizeName(name, delimiter, arrayIndexes);
        result[normalizedName] = currentNode;
      }
    } else if (isInputNode(currentNode) && /CHECKBOX|RADIO/i.test(currentNode.type)) {
      if (shouldClean) {
        currentNode.checked = false;
      }

      const normalizedName = normalizeName(name, delimiter, arrayIndexes).replace(ARRAY_ITEM_REGEXP, "[]");

      if (!result[normalizedName]) {
        result[normalizedName] = [];
      }

      const existing = result[normalizedName];
      if (Array.isArray(existing)) {
        existing.push(currentNode);
      } else {
        result[normalizedName] = [existing, currentNode];
      }
    } else if (isSupportedField(currentNode)) {
      if (shouldClean) {
        currentNode.value = "";
      }

      const normalizedName = normalizeName(name, delimiter, arrayIndexes);
      result[normalizedName] = currentNode;
    }

    currentNode = currentNode.nextSibling;
  }

  return result;
}

function setValue(field: SupportedFieldCollection, value: unknown): void {
  if (Array.isArray(field)) {
    for (const inputNode of field) {
      if (isInputNode(inputNode) && (inputNode.value === String(value) || value === true)) {
        inputNode.checked = true;
      }
    }
    return;
  }

  if (isInputNode(field) || isTextareaNode(field)) {
    field.value = String(value ?? "");
    return;
  }

  if (isSelectNode(field)) {
    const options = field.getElementsByTagName("option");
    for (let index = 0; index < options.length; index += 1) {
      const option = options[index];
      if (!option) {
        continue;
      }

      if (option.value === String(value)) {
        option.selected = true;
        if (field.multiple) {
          break;
        }
      } else if (!field.multiple) {
        option.selected = false;
      }
    }
  }
}

function toPathEntries(data: unknown): Entry[] {
  return objectToEntries(data).map((entry) => ({
    key: entry.key,
    value: entry.value
  }));
}

export function flattenDataForForm(data: unknown): Entry[] {
  return toPathEntries(data);
}

export function mapFieldsByName(
  rootNode: RootNodeInput,
  options: Pick<ObjectToFormOptions, "delimiter" | "useIdIfEmptyName" | "shouldClean" | "document"> = {}
): FieldMap {
  const resolvedRoot = resolveRootNode(rootNode, options);
  if (!resolvedRoot) {
    return {};
  }

  return getFields(
    resolvedRoot,
    options.useIdIfEmptyName ?? false,
    options.delimiter ?? ".",
    {},
    options.shouldClean ?? true
  );
}

export function objectToForm(rootNode: RootNodeInput, data: unknown, options: ObjectToFormOptions = {}): void {
  const resolvedRoot = resolveRootNode(rootNode, options);
  if (!resolvedRoot) {
    return;
  }

  const delimiter = options.delimiter ?? ".";
  const fieldValues = toPathEntries(data);
  const formFieldsByName = getFields(
    resolvedRoot,
    options.useIdIfEmptyName ?? false,
    delimiter,
    {},
    options.shouldClean ?? true
  );

  for (const fieldValue of fieldValues) {
    const fieldName = fieldValue.key;
    const value = fieldValue.value;

    if (formFieldsByName[fieldName]) {
      setValue(formFieldsByName[fieldName], value);
      continue;
    }

    const arraySyntaxName = fieldName.replace(ARRAY_ITEM_REGEXP, "[]");
    if (formFieldsByName[arraySyntaxName]) {
      setValue(formFieldsByName[arraySyntaxName], value);
      continue;
    }

    const bareArrayName = fieldName.replace(ARRAY_ITEM_REGEXP, "");
    if (formFieldsByName[bareArrayName]) {
      setValue(formFieldsByName[bareArrayName], value);
    }
  }
}

export function js2form(
  rootNode: RootNodeInput,
  data: unknown,
  delimiter = ".",
  nodeCallback: ObjectToFormNodeCallback = null,
  useIdIfEmptyName = false
): void {
  void nodeCallback;
  objectToForm(rootNode, data, {
    delimiter,
    useIdIfEmptyName
  });
}

export { normalizeName };
export type { Entry } from "@form2js/core";

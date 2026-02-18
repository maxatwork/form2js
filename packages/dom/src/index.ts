import { entriesToObject, type Entry, type ObjectTree, type ParseOptions } from "@form2js/core";

export interface NodeCallbackResult {
  name?: string;
  key?: string;
  value: unknown;
}

export type FormToObjectNodeCallback = (node: Node) => NodeCallbackResult | false | null | undefined;

export interface ExtractOptions {
  nodeCallback?: FormToObjectNodeCallback;
  useIdIfEmptyName?: boolean;
  getDisabled?: boolean;
  document?: Document;
}

export interface FormToObjectOptions extends ExtractOptions, ParseOptions {}

export type RootNodeInput =
  | string
  | Node
  | NodeListOf<Node>
  | Node[]
  | HTMLCollection
  | null
  | undefined;

function isNodeObject(value: unknown): value is Node {
  return (
    typeof value === "object" &&
    value !== null &&
    "nodeType" in value &&
    "nodeName" in value
  );
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

function isNodeDisabled(node: Node): boolean {
  return "disabled" in node && Boolean((node as { disabled?: boolean }).disabled);
}

function isFormControlNode(node: Node): node is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return isInputNode(node) || isTextareaNode(node) || isSelectNode(node);
}

function getFirstLegendChild(fieldset: Element): Element | null {
  for (let index = 0; index < fieldset.children.length; index += 1) {
    const child = fieldset.children[index];
    if (child?.nodeName.toUpperCase() === "LEGEND") {
      return child;
    }
  }

  return null;
}

function isDisabledByAncestorFieldset(node: Element): boolean {
  let ancestor: Element | null = node.parentElement;

  while (ancestor) {
    const isDisabledFieldset =
      nodeNameIs(ancestor, "FIELDSET") && "disabled" in ancestor && Boolean((ancestor as { disabled?: boolean }).disabled);

    if (isDisabledFieldset) {
      const firstLegend = getFirstLegendChild(ancestor);
      if (firstLegend?.contains(node)) {
        ancestor = ancestor.parentElement;
        continue;
      }

      return true;
    }

    ancestor = ancestor.parentElement;
  }

  return false;
}

function isEffectivelyDisabledControl(node: Node): boolean {
  if (!isFormControlNode(node)) {
    return false;
  }

  if (isNodeDisabled(node)) {
    return true;
  }

  return isDisabledByAncestorFieldset(node);
}

function isButtonLikeInputType(inputType: string): boolean {
  return /^(button|reset|submit|image)$/i.test(inputType);
}

function isNodeListLike(value: RootNodeInput): value is Node[] | NodeListOf<Node> | HTMLCollection {
  if (!value || typeof value === "string") {
    return false;
  }

  return !isNodeObject(value) && typeof value === "object" && "length" in value;
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

  if (isNodeListLike(rootNode) && rootNode.length > 0) {
    const firstNode = rootNode[0];
    if (isNodeObject(firstNode) && firstNode.ownerDocument) {
      return firstNode.ownerDocument;
    }
  }

  throw new Error("No document available. Provide options.document when running outside a browser.");
}

function resolveRootNode(rootNode: RootNodeInput, options: ExtractOptions): RootNodeInput {
  if (typeof rootNode !== "string") {
    return rootNode;
  }

  const doc = getDocumentFromRoot(rootNode, options.document);
  return doc.getElementById(rootNode);
}

function getFieldName(node: Node, useIdIfEmptyName: boolean): string {
  if (!isElementNode(node)) {
    return "";
  }

  const namedNode = node as Element & { name?: string; id?: string };

  if (namedNode.name && namedNode.name !== "") {
    return namedNode.name;
  }

  if (useIdIfEmptyName && namedNode.id && namedNode.id !== "") {
    return namedNode.id;
  }

  return "";
}

function getSelectedOptionValue(selectNode: HTMLSelectElement): string | string[] {
  if (!selectNode.multiple) {
    return selectNode.value;
  }

  const result: string[] = [];
  const options = selectNode.getElementsByTagName("option");

  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (option?.selected) {
      result.push(option.value);
    }
  }

  return result;
}

function getFieldValue(fieldNode: Node, getDisabled: boolean): unknown {
  if (isInputNode(fieldNode) || isTextareaNode(fieldNode)) {
    const textLikeNode = fieldNode as HTMLInputElement | HTMLTextAreaElement;

    if (isNodeDisabled(fieldNode) && !getDisabled) {
      return null;
    }

    if (isInputNode(fieldNode)) {
      const inputType = fieldNode.type.toLowerCase();

      if (isButtonLikeInputType(inputType)) {
        return null;
      }

      switch (inputType) {
        case "radio":
          if (fieldNode.checked && fieldNode.value === "false") {
            return false;
          }
        // eslint-disable-next-line no-fallthrough
        case "checkbox":
          if (fieldNode.checked && fieldNode.value === "true") {
            return true;
          }

          if (!fieldNode.checked && fieldNode.value === "true") {
            return false;
          }

          if (fieldNode.checked) {
            return fieldNode.value;
          }

          break;

        default:
          return fieldNode.value;
      }

      return null;
    }

    return textLikeNode.value;
  }

  if (isSelectNode(fieldNode)) {
    if (isNodeDisabled(fieldNode) && !getDisabled) {
      return null;
    }

    return getSelectedOptionValue(fieldNode);
  }

  return null;
}

function getSubFormValues(rootNode: Node, options: ExtractOptions): Entry[] {
  const result: Entry[] = [];
  let currentNode: ChildNode | null = rootNode.firstChild;

  while (currentNode) {
    result.push(...extractNodeValues(currentNode, options));
    currentNode = currentNode.nextSibling;
  }

  return result;
}

function extractNodeValues(node: Node, options: ExtractOptions): Entry[] {
  if (isEffectivelyDisabledControl(node) && !options.getDisabled) {
    return [];
  }

  const fieldName = getFieldName(node, options.useIdIfEmptyName ?? false);
  const callbackResult = options.nodeCallback?.(node);

  if (callbackResult && (callbackResult.name || callbackResult.key)) {
    const key = callbackResult.key ?? callbackResult.name ?? "";
    if (key !== "") {
      return [{ key, value: callbackResult.value }];
    }
  }

  if (fieldName !== "" && (isInputNode(node) || isTextareaNode(node))) {
    const fieldValue = getFieldValue(node, options.getDisabled ?? false);
    if (fieldValue === null) {
      return [];
    }

    return [{ key: fieldName, value: fieldValue }];
  }

  if (fieldName !== "" && isSelectNode(node)) {
    const fieldValue = getFieldValue(node, options.getDisabled ?? false);
    return [{ key: fieldName.replace(/\[\]$/, ""), value: fieldValue }];
  }

  return getSubFormValues(node, options);
}

function getFormValues(rootNode: Node, options: ExtractOptions): Entry[] {
  const directResult = extractNodeValues(rootNode, options);
  if (directResult.length > 0) {
    return directResult;
  }

  return getSubFormValues(rootNode, options);
}

export function extractPairs(rootNode: RootNodeInput, options: ExtractOptions = {}): Entry[] {
  const resolvedRoot = resolveRootNode(rootNode, options);

  if (!resolvedRoot) {
    return [];
  }

  if (isNodeListLike(resolvedRoot)) {
    const result: Entry[] = [];

    for (let index = 0; index < resolvedRoot.length; index += 1) {
      const currentNode = resolvedRoot[index];
      if (isNodeObject(currentNode)) {
        result.push(...getFormValues(currentNode, options));
      }
    }

    return result;
  }

  if (isNodeObject(resolvedRoot)) {
    return getFormValues(resolvedRoot, options);
  }

  return [];
}

export function formToObject(rootNode: RootNodeInput, options: FormToObjectOptions = {}): ObjectTree {
  const pairs = extractPairs(rootNode, options);
  const parseOptions: ParseOptions = {};

  if (options.delimiter !== undefined) {
    parseOptions.delimiter = options.delimiter;
  }

  if (options.skipEmpty !== undefined) {
    parseOptions.skipEmpty = options.skipEmpty;
  }

  if (options.allowUnsafePathSegments !== undefined) {
    parseOptions.allowUnsafePathSegments = options.allowUnsafePathSegments;
  }

  return entriesToObject(pairs, parseOptions);
}

export function form2js(
  rootNode: RootNodeInput,
  delimiter?: string,
  skipEmpty?: boolean,
  nodeCallback?: FormToObjectNodeCallback,
  useIdIfEmptyName = false,
  getDisabled = false,
  allowUnsafePathSegments = false
): ObjectTree {
  const normalizedOptions: FormToObjectOptions = {
    useIdIfEmptyName,
    getDisabled,
    allowUnsafePathSegments
  };

  if (delimiter !== undefined) {
    normalizedOptions.delimiter = delimiter;
  }

  if (skipEmpty !== undefined) {
    normalizedOptions.skipEmpty = skipEmpty;
  }

  if (nodeCallback !== undefined) {
    normalizedOptions.nodeCallback = nodeCallback;
  }

  return formToObject(rootNode, normalizedOptions);
}

import { formToObject, type FormToObjectOptions, type RootNodeInput } from "@form2js/dom";

export type ToObjectMode = "first" | "all" | "combine";

export interface ToObjectOptions extends Omit<FormToObjectOptions, "document"> {
  mode?: ToObjectMode;
}

interface JQueryCollectionLike {
  get(index: number): unknown;
  each(callback: (this: unknown, index: number, element: unknown) => void): unknown;
}

interface JQueryLike {
  fn: object;
  extend?: (target: object, ...sources: object[]) => object;
}

function isNodeObject(value: unknown): value is Node {
  return typeof value === "object" && value !== null && "nodeType" in value && "nodeName" in value;
}

function isJQueryLike(value: unknown): value is JQueryLike {
  return typeof value === "function" || (typeof value === "object" && value !== null && "fn" in value);
}

export function installToObjectPlugin($: JQueryLike): void {
  if (!$.fn) {
    throw new TypeError("jQuery-like object with fn is required");
  }

  const fnObject = $.fn as Record<string, unknown>;

  if (typeof fnObject.toObject === "function") {
    return;
  }

  fnObject.toObject = function toObject(this: JQueryCollectionLike, options?: ToObjectOptions): unknown {
    switch (options?.mode) {
      case "all": {
        const result: unknown[] = [];
        this.each(function eachMatched() {
          result.push(formToObject(this as RootNodeInput, options));
        });

        return result;
      }

      case "combine": {
        const roots: Node[] = [];
        this.each(function eachMatched() {
          if (isNodeObject(this)) {
            roots.push(this);
          }
        });

        return formToObject(roots, options);
      }

      case "first":
      default:
        return formToObject(this.get(0) as RootNodeInput, options);
    }
  };
}

export function maybeAutoInstallPlugin(scope: unknown = globalThis): void {
  if (!isJQueryLike(scope)) {
    return;
  }

  const jqueryLike = scope as JQueryLike;
  if (jqueryLike.fn) {
    installToObjectPlugin(jqueryLike);
  }
}

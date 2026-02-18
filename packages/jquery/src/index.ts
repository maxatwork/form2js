import { form2js, type FormToObjectNodeCallback, type RootNodeInput } from "@form2js/dom";

export type ToObjectMode = "first" | "all" | "combine";

export interface ToObjectOptions {
  mode?: ToObjectMode;
  delimiter?: string;
  skipEmpty?: boolean;
  nodeCallback?: FormToObjectNodeCallback;
  useIdIfEmptyName?: boolean;
  getDisabled?: boolean;
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

function getFnObject($: JQueryLike): Record<string, unknown> {
  return $.fn as Record<string, unknown>;
}

interface ResolvedToObjectOptions {
  mode: ToObjectMode;
  delimiter: string;
  skipEmpty: boolean;
  nodeCallback?: FormToObjectNodeCallback;
  useIdIfEmptyName: boolean;
  getDisabled: boolean;
}

function applySettings(options?: ToObjectOptions): ResolvedToObjectOptions {
  const settings: ResolvedToObjectOptions = {
    mode: options?.mode ?? "first",
    delimiter: options?.delimiter ?? ".",
    skipEmpty: options?.skipEmpty ?? true,
    useIdIfEmptyName: options?.useIdIfEmptyName ?? false,
    getDisabled: options?.getDisabled ?? false
  };

  if (options?.nodeCallback) {
    settings.nodeCallback = options.nodeCallback;
  }

  return settings;
}

function isJQueryLike(value: unknown): value is JQueryLike {
  return typeof value === "function" || (typeof value === "object" && value !== null && "fn" in value);
}

export function installToObjectPlugin($: JQueryLike): void {
  if (!$.fn) {
    throw new TypeError("jQuery-like object with fn is required");
  }

  const fnObject = getFnObject($);

  if (typeof fnObject.toObject === "function") {
    return;
  }

  fnObject.toObject = function toObject(this: JQueryCollectionLike, options?: ToObjectOptions): unknown {
    const settings = applySettings(options);

    switch (settings.mode) {
      case "all": {
        const result: unknown[] = [];
        this.each(function eachMatched() {
          result.push(
            form2js(
              this as RootNodeInput,
              settings.delimiter,
              settings.skipEmpty,
              settings.nodeCallback,
              settings.useIdIfEmptyName,
              settings.getDisabled
            )
          );
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

        return form2js(
          roots,
          settings.delimiter,
          settings.skipEmpty,
          settings.nodeCallback,
          settings.useIdIfEmptyName,
          settings.getDisabled
        );
      }

      case "first":
      default:
        return form2js(
          this.get(0) as RootNodeInput,
          settings.delimiter,
          settings.skipEmpty,
          settings.nodeCallback,
          settings.useIdIfEmptyName,
          settings.getDisabled
        );
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

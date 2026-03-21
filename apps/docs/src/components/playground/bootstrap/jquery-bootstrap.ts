import $ from "jquery";
import { installToObjectPlugin } from "@form2js/jquery";

type JQueryWithPlugin = typeof $ & {
  fn: {
    toObject?: unknown;
  };
};

let installedPlugin: unknown = null;

export function ensureJqueryBootstrap(): unknown {
  const jquery = $ as JQueryWithPlugin;

  if (typeof jquery.fn.toObject !== "function") {
    installToObjectPlugin(jquery);
  }

  installedPlugin = jquery.fn.toObject ?? null;
  return installedPlugin;
}

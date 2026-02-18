import { maybeAutoInstallPlugin } from "./index";

interface JQueryGlobal {
  jQuery?: unknown;
}

const scope = globalThis as typeof globalThis & JQueryGlobal;

if (scope.jQuery) {
  maybeAutoInstallPlugin(scope.jQuery);
}

export { installToObjectPlugin, maybeAutoInstallPlugin } from "./index";

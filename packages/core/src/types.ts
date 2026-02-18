export type EntryValue = unknown;

export interface Entry {
  key: string;
  value: EntryValue;
}

export interface NameValuePair {
  name: string;
  value: EntryValue;
}

export interface ParseOptions {
  delimiter?: string;
  skipEmpty?: boolean;
  allowUnsafePathSegments?: boolean;
}

export interface MergeContext {
  arrays: Record<string, Record<string, unknown>>;
}

export interface MergeOptions {
  delimiter?: string;
  context?: MergeContext;
  allowUnsafePathSegments?: boolean;
}

export type ObjectTree = Record<string, unknown>;

export type EntryInput =
  | Entry
  | NameValuePair
  | readonly [string, EntryValue]
  | {
      key: string;
      value: EntryValue;
    }
  | {
      name: string;
      value: EntryValue;
    };

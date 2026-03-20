import { formDataToObject, type InferSchemaOutput, type ObjectTree, type ParseOptions, type SchemaValidator } from "@form2js/form-data";
import { useCallback, useRef, useState, type SyntheticEvent } from "react";

export type UseForm2jsData<TSchema extends SchemaValidator | undefined> =
  TSchema extends SchemaValidator ? InferSchemaOutput<TSchema> : ObjectTree;

export type UseForm2jsSubmit<TSchema extends SchemaValidator | undefined = undefined> = (
  data: UseForm2jsData<TSchema>
) => Promise<void> | void;

export interface UseForm2jsOptions<TSchema extends SchemaValidator | undefined = undefined>
  extends ParseOptions {
  schema?: TSchema;
}

export interface UseForm2jsResult {
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => Promise<void>;
  isSubmitting: boolean;
  isError: boolean;
  error: unknown;
  isSuccess: boolean;
  reset: () => void;
}

function buildParseOptions(options: ParseOptions): ParseOptions {
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

  return parseOptions;
}

export function useForm2js<TSchema extends SchemaValidator | undefined = undefined>(
  submit: UseForm2jsSubmit<TSchema>,
  options: UseForm2jsOptions<TSchema> = {}
): UseForm2jsResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const isSubmittingRef = useRef(false);
  const { allowUnsafePathSegments, delimiter, schema, skipEmpty } = options;

  const reset = useCallback(() => {
    setIsError(false);
    setError(null);
    setIsSuccess(false);
  }, []);

  const onSubmit = useCallback(
    async (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => {
      event.preventDefault();

      if (isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setIsError(false);
      setError(null);
      setIsSuccess(false);

      try {
        const parseOptions = buildParseOptions(options);
        const formData = new FormData(event.currentTarget);

        const data = schema
          ? formDataToObject(formData, { ...parseOptions, schema })
          : formDataToObject(formData, parseOptions);

        await submit(data as UseForm2jsData<TSchema>);
        setIsSuccess(true);
      } catch (submitError: unknown) {
        setIsError(true);
        setError(submitError);
      } finally {
        setIsSubmitting(false);
        isSubmittingRef.current = false;
      }
    },
    [allowUnsafePathSegments, delimiter, schema, skipEmpty, submit]
  );

  return {
    onSubmit,
    isSubmitting,
    isError,
    error,
    isSuccess,
    reset
  };
}

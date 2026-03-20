// apps/docs/src/components/playground/PlaygroundShell.tsx
import React, { useEffect, useState } from "react";

import { VARIANT_IDS, variantsById } from "./variant-registry";
import { ResultPanel } from "./ResultPanel";
import type { ErrorInfo, OutputState, VariantDefinition, VariantId } from "./types";
import { VariantHeader } from "./VariantHeader";

function getRequestedRenderFault(): { variantId: VariantId; message: string } | null {
  if (typeof window === "undefined") return null;
  const requestedFault = new URLSearchParams(window.location.search).get("__fault");
  if (!requestedFault) return null;
  const [requestedVariantId, source] = requestedFault.split(":");
  if (source !== "render" || !VARIANT_IDS.includes(requestedVariantId as VariantId)) return null;
  const variantId = requestedVariantId as VariantId;
  return { variantId, message: `Injected render fault for ${variantsById[variantId].label}` };
}

function getActiveVariantId(): VariantId {
  if (typeof window === "undefined") return "react";
  const current = new URLSearchParams(window.location.search).get("variant");
  if (current && VARIANT_IDS.includes(current as VariantId)) return current as VariantId;
  return "react";
}

function createInitialOutputStates(
  variantId: VariantId
): Partial<Record<VariantId, OutputState>> {
  return { [variantId]: variantsById[variantId].createInitialOutputState() };
}

function dispatchVariantChange(variantId: VariantId): void {
  if (typeof window === "undefined") return;
  const variant = variantsById[variantId];
  window.dispatchEvent(
    new CustomEvent("form2js:variant-change", {
      detail: { variantId, packages: variant.packages }
    })
  );
}

interface VariantErrorBoundaryProps {
  children: React.ReactNode;
  onError: (errorInfo: ErrorInfo) => void;
}
interface VariantErrorBoundaryState { hasError: boolean; }

class VariantErrorBoundary extends React.Component<VariantErrorBoundaryProps, VariantErrorBoundaryState> {
  state: VariantErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): VariantErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error): void {
    this.props.onError({ message: error.message, source: "render" });
  }
  render(): React.ReactNode {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function PlaygroundShell(): React.JSX.Element {
  const [activeVariantId, setActiveVariantId] = useState<VariantId>(() => getActiveVariantId());
  const [mountedVariantIds, setMountedVariantIds] = useState<VariantId[]>(() => [getActiveVariantId()]);
  const [outputStates, setOutputStates] = useState<Partial<Record<VariantId, OutputState>>>(() =>
    createInitialOutputStates(getActiveVariantId())
  );
  const [failedVariants, setFailedVariants] = useState<Partial<Record<VariantId, ErrorInfo>>>({});

  useEffect(() => {
    dispatchVariantChange(activeVariantId);
  }, []);

  useEffect(() => {
    if (!mountedVariantIds.includes(activeVariantId)) {
      setMountedVariantIds((current) => [...current, activeVariantId]);
    }
    setOutputStates((current) => {
      if (current[activeVariantId]) return current;
      return { ...current, [activeVariantId]: variantsById[activeVariantId].createInitialOutputState() };
    });
  }, [activeVariantId, mountedVariantIds]);

  useEffect(() => {
    const requestedFault = getRequestedRenderFault();
    if (requestedFault?.variantId !== activeVariantId || failedVariants[activeVariantId] !== undefined) {
      return;
    }

    handleVariantFailure(activeVariantId, { message: requestedFault.message, source: "render" });
  }, [activeVariantId, failedVariants]);

  const activeVariant = variantsById[activeVariantId];
  const activeOutputState = outputStates[activeVariantId] ?? activeVariant.createInitialOutputState();
  const variants = VARIANT_IDS.map((variantId) => variantsById[variantId]);

  function handleVariantFailure(variantId: VariantId, errorInfo: ErrorInfo): void {
    setFailedVariants((current) => ({ ...current, [variantId]: errorInfo }));
    setOutputStates((current) => {
      return Object.fromEntries(
        Object.entries(current).filter(([currentVariantId]) => currentVariantId !== variantId)
      ) as Partial<Record<VariantId, OutputState>>;
    });
  }

  function selectVariant(variantId: VariantId): void {
    if (typeof window !== "undefined") {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("variant", variantId);
      window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
      dispatchVariantChange(variantId);
    }
    setActiveVariantId(variantId);
  }

  return (
    <section aria-label="Unified playground" className="pg-shell">
      <VariantHeader activeId={activeVariantId} onSelect={selectVariant} variants={variants} />
      <div className="pg-body">
        <div className="pg-form-col">
          <p className="pg-variant-summary">{activeVariant.summary}</p>
          {mountedVariantIds.map((variantId) => {
            const variant: VariantDefinition = variantsById[variantId];
            const isActive = variantId === activeVariantId;
            if (failedVariants[variantId]) return null;
            return (
              <div hidden={!isActive} key={variantId}>
                <VariantErrorBoundary
                  onError={(errorInfo) => {
                    handleVariantFailure(variantId, errorInfo);
                  }}
                >
                  <variant.Component
                    isActive={isActive}
                    onOutputChange={(outputState) => {
                      setOutputStates((current) => ({ ...current, [variantId]: outputState }));
                    }}
                    reportFatalError={(errorInfo) => {
                      handleVariantFailure(variantId, errorInfo);
                    }}
                  />
                </VariantErrorBoundary>
              </div>
            );
          })}
          {failedVariants[activeVariantId] && (
            <section aria-label="Failed variant">
              <p>{activeVariant.label} failed to load.</p>
              <p>{failedVariants[activeVariantId]?.message}</p>
            </section>
          )}
        </div>
        <div className="pg-output-col">
          <ResultPanel outputState={activeOutputState} />
        </div>
      </div>
    </section>
  );
}

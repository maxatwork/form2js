// apps/docs/src/components/playground/VariantHeader.tsx
import React from "react";
import type { VariantDefinition, VariantId } from "./types";

interface VariantHeaderProps {
  activeId: VariantId;
  variants: VariantDefinition[];
  onSelect: (variantId: VariantId) => void;
}

export function VariantHeader({ activeId, variants, onSelect }: VariantHeaderProps): React.JSX.Element {
  return (
    <div className="pg-tabs" aria-label="Variant switcher">
      {variants.map((variant) => (
        <button
          key={variant.id}
          aria-pressed={variant.id === activeId}
          className="pg-tab-btn"
          data-variant-id={variant.id}
          onClick={() => {
            onSelect(variant.id);
          }}
          type="button"
        >
          {variant.label}
        </button>
      ))}
    </div>
  );
}

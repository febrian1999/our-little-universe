import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="mt-10 rounded-3xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
      {children}
    </p>
  );
}

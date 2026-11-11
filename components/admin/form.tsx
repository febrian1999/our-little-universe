import type { ReactNode } from "react";

const inputClass =
  "w-full rounded-xl border border-pink-100/80 bg-white/90 px-3.5 py-2 text-base text-neutral-900 shadow-2xs transition focus-visible:border-pink-400 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <label className="text-sm text-neutral-700">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <input
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <label className="text-sm text-neutral-700">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
}) {
  return (
    <label className="text-sm text-neutral-700">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-600">
        {label}
      </span>
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Pesan hasil redirect `?error=` / `?ok=` dari server action. */
export function Notice({ error, ok }: { error?: string; ok?: string }) {
  if (error) {
    return (
      <p
        role="alert"
        className="mt-4 rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-700 shadow-2xs backdrop-blur-xs"
      >
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="mt-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-700 shadow-2xs backdrop-blur-xs">
        Tersimpan dengan sukses ✨
      </p>
    );
  }
  return null;
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      {children}
    </div>
  );
}

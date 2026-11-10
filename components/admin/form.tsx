import type { ReactNode } from "react";

const inputClass =
  "w-full rounded-xl border border-neutral-300 px-3 py-2 text-base text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

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
      <span className="mb-1 block font-medium">{label}</span>
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
      <span className="mb-1 block font-medium">{label}</span>
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
      <span className="mb-1 block font-medium">{label}</span>
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
        className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {error}
      </p>
    );
  }
  if (ok) {
    return (
      <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Tersimpan.
      </p>
    );
  }
  return null;
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      {children}
    </div>
  );
}

import * as React from "react";

export function Select({
  value,
  onChange,
  options = [],
  placeholder,
  disabled,
  className = "",
}) {
  return (
    <select
      className={
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 " +
        className
      }
      value={value ?? ""}
      onChange={(e) => onChange && onChange(e.target.value || null)}
      disabled={disabled}
    >
      <option value="">{placeholder ?? "Seleccione..."}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.value ?? opt.label}
          {opt.label && opt.value !== opt.label ? ` - ${opt.label}` : ""}
        </option>
      ))}
    </select>
  );
}

import type { InputHTMLAttributes } from 'react';
import { inputClass } from './styles';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormField({ label, error, id, ...props }: FormFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input id={fieldId} aria-invalid={Boolean(error)} className={inputClass} {...props} />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
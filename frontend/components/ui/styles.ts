type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'light' | 'lightOutline';
type Size = 'md' | 'sm';

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border-blue-600 bg-white text-blue-600 hover:bg-blue-50',
  ghost: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
  danger: 'border-transparent bg-red-600 text-white hover:bg-red-700',
  light: 'border-transparent bg-white text-blue-700 hover:bg-blue-50',
  lightOutline: 'border-white/70 bg-transparent text-white hover:bg-white/15',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  sm: 'px-3.5 py-1.5 text-sm',
};

interface ButtonOptions {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

// Dipakai untuk <button> maupun <Link> agar tampilannya sama
export function buttonClass({ variant = 'primary', size = 'md', block = false }: ButtonOptions = {}): string {
  return [base, variants[variant], sizes[size], block ? 'w-full' : ''].filter(Boolean).join(' ');
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 aria-[invalid=true]:border-red-500';

export const panelClass = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-md';
export const titleClass = 'text-2xl font-bold text-slate-900';
export const subtitleClass = 'mb-6 mt-1 text-slate-500';
export const backLinkClass = 'mb-4 inline-block text-sm font-medium text-blue-600 hover:underline';
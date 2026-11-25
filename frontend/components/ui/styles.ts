
type Variant =
  | "primary"
  | "outline"
  | "ghost"
  | "danger"
  | "light"
  | "lightOutline";

type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 border font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315b48]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "border-[#315b48] bg-[#315b48] text-white hover:border-[#254936] hover:bg-[#254936]",

  outline:
    "border-[#315b48] bg-transparent text-[#315b48] hover:bg-[#e9eee8]",

  ghost:
    "border-transparent bg-transparent text-[#555b52] hover:border-[#d9d7cc] hover:bg-[#eeece3]",

  danger:
    "border-[#a44439] bg-[#a44439] text-white hover:border-[#87372f] hover:bg-[#87372f]",

  light:
    "border-transparent bg-[#fffefa] text-[#315b48] hover:bg-[#eeece3]",

  lightOutline:
    "border-white/60 bg-transparent text-white hover:bg-white/10",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 py-2.5 text-sm",
  sm: "min-h-9 px-3.5 py-1.5 text-sm",
};

interface ButtonOptions {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

// Dipakai untuk <button> maupun <Link>
export function buttonClass({
  variant = "primary",
  size = "md",
  block = false,
}: ButtonOptions = {}): string {
  return [
    base,
    variants[variant],
    sizes[size],
    "rounded-[5px]",
    block ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

// Form input
export const inputClass =
  "w-full rounded-[5px] border border-[#d9d7cc] bg-[#fffefa] px-3.5 py-3 text-sm text-[#292d27] placeholder:text-[#99998e] transition-colors duration-150 focus:border-[#315b48] focus:outline-none focus:ring-2 focus:ring-[#315b48]/10 aria-[invalid=true]:border-[#a44439] aria-[invalid=true]:focus:ring-[#a44439]/10";

// Panel utama
export const panelClass =
  "rounded-[7px] border border-[#d9d7cc] bg-[#fffefa] p-5 sm:p-7";

// Judul halaman
export const titleClass =
  "text-2xl font-semibold tracking-tight text-[#292d27] sm:text-[2rem]";

// Deskripsi halaman
export const subtitleClass =
  "mb-6 mt-2 max-w-2xl text-sm leading-7 text-[#77796f]";

// Tautan kembali
export const backLinkClass =
  "mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#315b48] transition-colors hover:text-[#254936] hover:underline";

import type { ReactNode } from "react";
import { buttonClass } from "./styles";

interface StateMessageProps {
  variant: "loading" | "error" | "empty";
  text: string;
  onRetry?: () => void;
  children?: ReactNode;
}

const textColor = {
  loading: "text-slate-500",
  empty: "text-slate-500",
  error: "text-red-600",
};

export default function StateMessage({
  variant,
  text,
  onRetry,
  children,
}: StateMessageProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 px-4 py-16 text-center ${textColor[variant]}`}
    >
      {variant === "loading" && (
        <div
          aria-hidden="true"
          className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
        />
      )}

      <p>{text}</p>

      {variant === "error" && onRetry && (
        <button
          type="button"
          className={buttonClass({ variant: "outline", size: "sm" })}
          onClick={onRetry}
        >
          Coba lagi
        </button>
      )}

      {children}
    </div>
  );
}
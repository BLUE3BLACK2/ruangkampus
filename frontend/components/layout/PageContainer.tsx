import type { ReactNode } from 'react';

export default function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl px-5 py-8 pb-16">{children}</div>;
}
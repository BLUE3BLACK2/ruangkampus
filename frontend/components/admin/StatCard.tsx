
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <Icon size={22} />
        </div>
      </div>

      <h3 className="mt-4 text-2xl font-bold tracking-tight text-[#12345B] md:text-3xl">
        {value}
      </h3>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
        <TrendingUp size={15} className="text-blue-600" />
        <span>{description}</span>
      </div>
    </div>
  );
}

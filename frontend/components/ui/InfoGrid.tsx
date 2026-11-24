interface InfoItem {
  label: string;
  value: string | number;
}

export default function InfoGrid({ items }: { items: InfoItem[] }) {
  return (
    <div className="my-4 grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-slate-50 p-3">
          <span className="block text-xs text-slate-500">{item.label}</span>
          <strong className="font-semibold text-slate-900">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
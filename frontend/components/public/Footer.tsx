
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Ruang<span className="text-blue-600">Kuliah</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Sistem reservasi ruangan kampus yang lebih mudah.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          © 2026 RuangKuliah
        </p>
      </div>
    </footer>
  );
}

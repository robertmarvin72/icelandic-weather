export default function Header() {
  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:bg-slate-900/80 dark:border-slate-700">
      <div className="max-w-6xl mx-auto flex items-center gap-3 px-4 py-3">

        {/* Logo */}
        <img
          src="/campcast-64.png"
          alt="CampCast logo"
          className="h-10 w-10 rounded-lg shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/70"
        />

        {/* Title */}
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Iceland Camping Weather
        </span>

      </div>
    </header>
  );
}

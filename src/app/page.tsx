export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          ODDORA AI V2 • ENGINE CORE ACTIVE
        </div>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
          Oddora AI <span className="text-emerald-400">V2</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          Modular Quantitative Sports Intelligence Engine & Combinatorial Ticket Solver.
        </p>
      </div>
    </main>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070A0E] text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          404 • Page Not Found
        </span>
        <h1 className="text-3xl font-black">Oddora AI V2</h1>
        <p className="text-sm text-slate-400">
          The page or route you are looking for does not exist or has been moved.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.14),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.12),transparent_35%)]" />

      <section className="relative z-10 w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur md:p-12">
        <p className="mb-4 inline-flex rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-300">
          Team Task Manager
        </p>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-100 md:text-6xl">
          Manage Your Team&apos;s Tasks with Ease
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
          Plan projects, assign work, and track progress with role-based access
          for Admins and Members. Keep every task visible, accountable, and on time.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Login
          </Link>
        </div>
      </section>
    </main>
  );
}

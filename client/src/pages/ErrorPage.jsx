import { Link } from "react-router-dom";
import { ArrowLeft, House, TriangleAlert } from "lucide-react";

export default function ErrorPage({ status = 404, title, message }) {
  const errorStatus = status;
  const isServerError = errorStatus >= 500;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="glass-panel w-full max-w-xl p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <TriangleAlert size={30} aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-300">
          Error {errorStatus}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {title || (isServerError ? "Something went wrong" : "Page not found")}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-slate-500 dark:text-slate-400">
          {message || (isServerError
            ? "We could not complete that request. Please try again in a moment."
            : "The page you are looking for may have moved or the address may be incorrect.")}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700">
            <House size={17} aria-hidden="true" /> Go to dashboard
          </Link>
          <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900">
            <ArrowLeft size={17} aria-hidden="true" /> Go back
          </button>
        </div>
      </section>
    </main>
  );
}

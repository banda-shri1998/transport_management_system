export default function PageContainer({ title, subtitle, children, actions }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {(title || subtitle || actions) && (
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/70 p-6 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/75 dark:shadow-black/20 md:flex-row md:items-center md:justify-between">
          <div>
            {title && (
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

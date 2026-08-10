import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

const SunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
  </svg>
);

const MoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDark(!dark);
  };

  const linkClass = ({ isActive }) =>
    [
      "rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-gradient-to-r from-slate-900 to-blue-600 text-white shadow-lg shadow-blue-500/20 dark:from-white dark:to-slate-300 dark:text-slate-900"
        : "text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white",
    ].join(" ");

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/70 backdrop-blur-xl dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
            TM
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Transport Manager
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Operations, reporting, and payment tracking
            </p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 rounded-2xl border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur md:flex dark:border-slate-800 dark:bg-slate-900/70">
          <NavLink to="/" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/add" className={linkClass}>
            Add Record
          </NavLink>
          <NavLink to="/records" className={linkClass}>
            Records
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>
          <NavLink to="/party-statement" className={linkClass}>
            Party Statement
          </NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-2xl border border-slate-200 bg-white/80 p-2.5 text-slate-600 shadow-sm hover:-translate-y-0.5 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:text-white"
            aria-label="Toggle theme"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-red-500/20 hover:-translate-y-0.5 hover:bg-red-500"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-2 px-6 pb-4 md:hidden">
        <div className="flex w-full overflow-x-auto rounded-2xl border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <NavLink to="/" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/add" className={linkClass}>
            Add
          </NavLink>
          <NavLink to="/records" className={linkClass}>
            Records
          </NavLink>
          <NavLink to="/reports" className={linkClass}>
            Reports
          </NavLink>
          <NavLink to="/party-statement" className={linkClass}>
            Party Statement
          </NavLink>
        </div>
      </div>
    </header>
  );
}

import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Staff");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (isSignup) {
        if (!name.trim()) {
          throw new Error("Name is required");
        }

        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        });
      } else {
        await login(email.trim(), password);
      }

      navigate("/");
    } catch (err) {
      console.error("AUTH ERROR:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          (isSignup ? "Unable to create account" : "Invalid email or password"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const swapMode = () => {
    setMode((currentMode) => (currentMode === "login" ? "signup" : "login"));
    setError("");
    setSuccess("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-black/20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden bg-gradient-to-br from-blue-700 via-slate-900 to-violet-700 p-10 text-white lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                Transport management suite
              </div>
              <h1 className="mt-8 text-4xl font-semibold tracking-tight">
                Control records, reports, and collections from one place.
              </h1>
              <p className="mt-5 max-w-md text-sm text-white/80">
                A cleaner operations console for transport entries, balance tracking, and historical data movement.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-white/70">Track</p>
                <p className="mt-2 text-lg font-semibold">Payments and balances</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-sm text-white/70">Move</p>
                <p className="mt-2 text-lg font-semibold">Import and export records</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-bold text-white shadow-lg shadow-blue-500/30">
                TM
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {isSignup ? "Create account" : "Welcome back"}
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {isSignup
                  ? "Sign up to start managing transport operations."
                  : "Sign in to continue managing transport operations."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              {error && (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              {success && (
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/80 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {success}
                </p>
              )}

              {isSignup && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    className="w-full"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  className="w-full"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  className="w-full"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isSignup && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <input
                      className="w-full"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Role
                    </label>
                    <select
                      className="w-full"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="Staff">Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </>
              )}

              <button className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 dark:from-white dark:to-slate-300 dark:text-slate-900">
                {submitting ? "Please wait..." : isSignup ? "Create Account" : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {isSignup ? "Already have an account?" : "New here?"}{" "}
              <button
                type="button"
                onClick={swapMode}
                className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
              >
                {isSignup ? "Login" : "Create an account"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

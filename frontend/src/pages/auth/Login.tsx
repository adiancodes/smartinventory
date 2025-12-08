import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import TopNavbar from "../../components/layout/TopNavbar";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setError(null);
      const profile = await login(values.email, values.password);
      if (profile.role === "ADMIN") {
        navigate("/admin/dashboard");
      } else if (profile.role === "MANAGER") {
        navigate("/manager/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Unable to sign in");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNavbar
        primaryAction={{ label: "Get Started", to: "/register" }}
        secondaryAction={{ label: "Home", to: "/" }}
        className="py-4"
      />
      <main className="flex w-full flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40 md:grid-cols-2 md:p-12">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-midnight shadow-sm dark:bg-slate-800/80 dark:text-slate-100">
              Welcome back
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-midnight dark:text-white">
              Log in to continue managing smart inventory across every location.
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Use your SmartShelfX credentials to jump straight into analytics, purchase history, and real-time stock
              tracking. Forgot your access? Contact your administrator to reset permissions.
            </p>
            <ul className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm dark:bg-slate-800/70">
                <span className="h-2 w-2 rounded-full bg-sunshine" />
                Secure single workspace for every warehouse.
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm dark:bg-slate-800/70">
                <span className="h-2 w-2 rounded-full bg-sunshine" />
                Role-aware dashboards ensure the right insights for every teammate.
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/90 p-8 shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                Sign in
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-midnight dark:text-white">SmartShelfX</h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email"
                    {...register("email")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    {...register("password")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                </div>
              </div>
              {error && <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-300">{error}</div>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-midnight px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-300">
              <p>Don&apos;t have an account yet?</p>
              <Link to="/register" className="font-semibold text-midnight hover:underline dark:text-amber-300">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

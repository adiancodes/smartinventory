import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

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
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col items-center justify-center bg-midnight text-white">
        <h1 className="text-3xl font-semibold">Welcome Back!</h1>
      </div>
      <div className="flex flex-1 items-center justify-center bg-sunshine">
        <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Already Members</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-600" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  {...register("email")}
                  className="rounded-md border border-slate-200 px-4 py-3 text-slate-900 focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/50"
                />
                {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-600" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  className="rounded-md border border-slate-200 px-4 py-3 text-slate-900 focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/50"
                />
                {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
              </div>
            </div>
            {error && <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-600">{error}</div>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Don&apos;t have an account yet?</p>
            <Link to="/register" className="font-semibold text-slate-900">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import TopNavbar from "../../components/layout/TopNavbar";

const registerObject = z.object({
  fullName: z.string().min(3),
  companyName: z.string().optional(),
  officialEmail: z.string().email(),
  contactNumber: z.string().optional(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "USER"]),
  warehouseLocationCode: z.string().optional(),
  warehouseLocationName: z.string().optional()
});

const registerSchema = registerObject
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })
  .superRefine((data, ctx) => {
    if (data.role !== "ADMIN") {
      if (!data.warehouseLocationName || data.warehouseLocationName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["warehouseLocationName"],
          message: "Warehouse location is required"
        });
      }
      if (!data.warehouseLocationCode || data.warehouseLocationCode.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["warehouseLocationCode"],
          message: "Warehouse code is required"
        });
      }
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "USER" }
  });

  const selectedRole = watch("role");

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setError(null);
      await registerUser({
        fullName: values.fullName,
        companyName: values.companyName,
        officialEmail: values.officialEmail,
        contactNumber: values.contactNumber,
        password: values.password,
        role: values.role,
        warehouseLocationCode: values.role !== "ADMIN" ? values.warehouseLocationCode?.trim() : undefined,
        warehouseLocationName: values.warehouseLocationName?.trim()
      });
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message ?? "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-sky-200 to-sky-100 text-slate-900 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <TopNavbar
        primaryAction={{ label: "Login", to: "/login" }}
        secondaryAction={{ label: "Home", to: "/" }}
        className="py-4"
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-10 rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl shadow-sky-200/30 backdrop-blur-sm transition dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-slate-900/40 md:grid-cols-2 md:p-12">
          <section className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-midnight shadow-sm dark:bg-slate-800/80 dark:text-slate-100">
              Create your workspace
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-midnight dark:text-white">
              Bring every warehouse, forecast, and purchase order into SmartShelfX.
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Register your team to unlock AI demand forecasts, automated restocking flows, and unified analytics across
              locations. Invite managers and buyers once you are inside.
            </p>
            <ul className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm dark:bg-slate-800/70">
                <span className="h-2 w-2 rounded-full bg-sunshine" />
                Onboard admins, managers, and store buyers with role-aware controls.
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm dark:bg-slate-800/70">
                <span className="h-2 w-2 rounded-full bg-sunshine" />
                Sync every warehouse SKU and monitor low stock in real time.
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm dark:bg-slate-800/70">
                <span className="h-2 w-2 rounded-full bg-sunshine" />
                Export audit-ready reports with a single click.
              </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have access? <Link to="/login" className="font-semibold text-midnight hover:underline dark:text-amber-300">Sign in</Link>
            </p>
          </section>
          <section className="rounded-2xl border border-white/40 bg-white/90 p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80 sm:p-8">
            <h2 className="mb-6 text-center text-2xl font-semibold text-midnight dark:text-white">Register</h2>
            <form className="grid grid-cols-1 gap-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    {...register("fullName")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="companyName">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    {...register("companyName")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="officialEmail">
                    Official Email ID
                  </label>
                  <input
                    id="officialEmail"
                    type="email"
                    {...register("officialEmail")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.officialEmail && <span className="text-xs text-red-500">{errors.officialEmail.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="contactNumber">
                    Contact Number
                  </label>
                  <input
                    id="contactNumber"
                    {...register("contactNumber")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    {...register("password")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    {...register("confirmPassword")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="role">
                    Role
                  </label>
                  <select
                    id="role"
                    {...register("role")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  >
                    <option value="USER">User</option>
                    <option value="MANAGER">Warehouse Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="warehouseLocationName">
                    Warehouse Location
                  </label>
                  <input
                    id="warehouseLocationName"
                    {...register("warehouseLocationName")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                  {errors.warehouseLocationName && (
                    <span className="text-xs text-red-500">{errors.warehouseLocationName.message}</span>
                  )}
                </div>
              </div>

              {selectedRole !== "ADMIN" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-200" htmlFor="warehouseLocationCode">
                    Warehouse Code
                  </label>
                  <input
                    id="warehouseLocationCode"
                    {...register("warehouseLocationCode")}
                    className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-slate-900 transition focus:border-sunshine focus:outline-none focus:ring-2 focus:ring-sunshine/40 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 rounded-lg bg-white/70 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                <input type="checkbox" required className="h-4 w-4" /> I agree to the Terms and Conditions
              </label>

              {error && (
                <div className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-600 dark:bg-red-500/20 dark:text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-midnight px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-midnight/90 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
              >
                {isSubmitting ? "Creating..." : "Register"}
              </button>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

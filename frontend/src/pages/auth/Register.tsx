import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

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
    <div className="flex min-h-screen">
      <div className="flex flex-1 flex-col justify-center bg-blue-600 px-16 text-white">
        <h2 className="mb-6 text-4xl font-bold uppercase tracking-widest">Information</h2>
        <p className="mb-6 max-w-md text-sm leading-relaxed">
          Welcome to SmartShelfX. Join us to revolutionize your inventory management with AI-powered forecasting and
          automated restocking.
        </p>
        <p className="text-sm">Already have an account?</p>
        <Link
          to="/login"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600"
        >
          Have an Account
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center bg-blue-50 p-12">
        <div className="w-full max-w-2xl">
          <h2 className="mb-6 text-center text-3xl font-semibold uppercase">Register Form</h2>
          <form className="grid grid-cols-2 gap-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="col-span-2 grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="fullName">
                  Full Name
                </label>
                <input id="fullName" {...register("fullName")} className="input" />
                {errors.fullName && <span className="text-xs text-red-500">{errors.fullName.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="companyName">
                  Company Name
                </label>
                <input id="companyName" {...register("companyName")} className="input" />
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="officialEmail">
                  Official Email ID
                </label>
                <input id="officialEmail" type="email" {...register("officialEmail")} className="input" />
                {errors.officialEmail && <span className="text-xs text-red-500">{errors.officialEmail.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="contactNumber">
                  Contact Number
                </label>
                <input id="contactNumber" {...register("contactNumber")} className="input" />
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="password">
                  Password
                </label>
                <input id="password" type="password" {...register("password")} className="input" />
                {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input id="confirmPassword" type="password" {...register("confirmPassword")} className="input" />
                {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
              </div>
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="role">
                  Role
                </label>
                <select id="role" {...register("role")} className="input">
                  <option value="USER">User</option>
                  <option value="MANAGER">Warehouse Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold" htmlFor="warehouseLocationName">
                  Warehouse Location
                </label>
                <input id="warehouseLocationName" {...register("warehouseLocationName")} className="input" />
                {errors.warehouseLocationName && (
                  <span className="text-xs text-red-500">{errors.warehouseLocationName.message}</span>
                )}
              </div>
            </div>
            {selectedRole !== "ADMIN" && (
              <div className="col-span-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold" htmlFor="warehouseLocationCode">
                    Warehouse Code
                  </label>
                  <input id="warehouseLocationCode" {...register("warehouseLocationCode")} className="input" />
                </div>
              </div>
            )}
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" required className="h-4 w-4" /> I agree to the Terms and Conditions
              </label>
            </div>
            {error && <div className="col-span-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-600">{error}</div>}
            <div className="col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold uppercase tracking-widest text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Register"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ash">
      <div className="rounded-xl bg-white p-10 shadow-md">
        <h1 className="text-2xl font-semibold text-slate-800">Access Denied</h1>
        <p className="mt-4 text-slate-500">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}

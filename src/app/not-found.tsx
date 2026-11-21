import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
      <p className="font-mono text-xs uppercase tracking-widest text-orange-700 mb-2">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 mb-2">
        Recipe not found
      </h1>
      <p className="text-sm text-neutral-600 mb-6 max-w-sm">
        The page you are looking for does not exist in Indian Cookbook for Students.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-neutral-950 text-white hover:bg-neutral-800 transition-colors"
      >
        Back to Cookbook
      </Link>
    </main>
  );
}

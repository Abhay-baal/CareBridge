import Link from "next/link";
import LoginForm from "../../../components/forms/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 transition-colors group-hover:bg-blue-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </span>
          Back to Home
        </Link>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              CareBridge
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Caring From Anywhere
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?
            </p>
            <Link
              href="/register"
              className="mt-1 inline-block text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
                Register
              </Link>
            </div>
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-gray-500 transition hover:text-blue-600"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

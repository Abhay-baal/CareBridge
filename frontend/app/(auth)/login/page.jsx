import LoginForm from "../../../components/forms/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-8 text-center">
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
            Don't have an account?
          </p>

          <a
            href="/register"
            className="mt-1 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  );
}
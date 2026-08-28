"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { forgotPassword } from "@/services/authService";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await forgotPassword({ email });
      toast.success("Reset code sent to your email");
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to send reset code"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm"
        >
          Back to Login
        </Link>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">
            Forgot password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            We will send a reset code to your email.
          </p>

          <form onSubmit={handleSubmit} className="mt-6">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset code"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

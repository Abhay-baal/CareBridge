"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/services/authService";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      await resetPassword({
        email,
        code,
        newPassword,
        confirmPassword,
      });
      toast.success("Password reset successfully");
      router.push("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to reset password"
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
            Reset password
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Enter the code from your email and create a new password.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Input
              label="Reset Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Create a new password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

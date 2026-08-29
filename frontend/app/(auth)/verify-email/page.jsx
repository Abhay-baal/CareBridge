"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import {
  verifyEmail,
  requestEmailVerification,
} from "@/services/authService";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();

    try {
      setVerifying(true);

      const response = await verifyEmail({
        email: email.trim(),
        code: code.trim(),
      });

      // Automatically log the newly registered user in.
      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      const user = response.user || response.data;

      if (user?.role) {
        localStorage.setItem("role", user.role);
      }

      if (user?.id || user?._id) {
        localStorage.setItem(
          "userId",
          user.id || user._id
        );
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      toast.success("Email verified! Welcome to CareBridge 🎉");

      if (user?.role === "child") {
        router.push("/child/dashboard");
      } else if (user?.role === "provider") {
        router.push("/provider/dashboard");
      } else if (user?.role === "parent") {
        router.push("/dashboard");
      } else {
        toast.error("Invalid user role. Please contact support.");
      }
    } catch (error) {
      console.error("Email verification failed:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to verify email"
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      setSending(true);

      await requestEmailVerification({
        email: email.trim(),
      });

      toast.success("Verification code sent again");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to resend code"
      );
    } finally {
      setSending(false);
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
            Verify email
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter the code we sent to your email address.
          </p>

          <form
            onSubmit={handleVerify}
            className="mt-6 space-y-4"
          >
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <Input
              label="Verification Code"
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />

            <Button type="submit" disabled={verifying}>
              {verifying ? "Verifying..." : "Verify email"}
            </Button>

            <button
              type="button"
              onClick={handleResend}
              disabled={sending}
              className="w-full text-sm font-semibold text-blue-600 transition hover:text-blue-700 disabled:opacity-50"
            >
              {sending ? "Resending..." : "Resend code"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

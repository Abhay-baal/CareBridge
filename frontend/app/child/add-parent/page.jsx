"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

import { connectParent } from "@/services/parentChildService";

export default function AddParentPage() {
  const router = useRouter();

  const [connectionCode, setConnectionCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const code = connectionCode.trim().toUpperCase();

    if (!code) {
      setError("Parent connection code is required.");
      return;
    }

    try {
      setLoading(true);

      await connectParent(code);

      toast.success("Parent connected successfully.");

      router.push("/child/my-parents");
    } catch (err) {
      console.error("Connect parent error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to connect parent.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md p-4">
      <Link
        href="/child/my-parents"
        className="text-sm text-blue-600"
      >
        ← My Parents
      </Link>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
            👨‍👩‍👧
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Add Parent
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Enter the connection code provided by your parent.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6"
        >
          <Input
            label="Parent Connection Code"
            type="text"
            placeholder="CB-ABC123"
            value={connectionCode}
            onChange={(event) =>
              setConnectionCode(
                event.target.value.toUpperCase()
              )
            }
          />

          {error && (
            <p className="mb-4 text-sm text-red-500">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Connecting..." : "Connect Parent"}
          </Button>
        </form>

        <div className="mt-5 rounded-xl bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-700">
            How to connect
          </p>

          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-blue-600">
            <li>Ask your parent for their connection code.</li>
            <li>Enter the code above.</li>
            <li>Your parent will appear in My Parents.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { loginUser } from "../../services/authService";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerError("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      console.log("===== MOBILE LOGIN DEBUG =====");
      console.log("Email being sent:", JSON.stringify(email));
      console.log("Email length:", email.length);
      console.log("Password length:", password.length);
      console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

      const response = await loginUser({
        email: email.trim(),
        password,
      });

      console.log("Login response:", response);

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

      toast.success("Login successful!");

      if (user?.role === "child") {
        router.push("/child/dashboard");
      } else if (user?.role === "provider") {
        router.push("/provider/dashboard");
      } else if (user?.role === "parent") {
        router.push("/dashboard");
      } else {
        setServerError(
          "Invalid user role. Please contact support."
        );
      }
    } catch (error) {
      console.error("===== LOGIN ERROR DEBUG =====");
      console.error("Status:", error.response?.status);
      console.error("Response:", error.response?.data);
      console.error("Request URL:", error.config?.url);
      console.error("Base URL:", error.config?.baseURL);
      console.error("Request data:", error.config?.data);
      console.error("Full error:", error);

      const message =
        error.response?.data?.message ||
        "Login failed. Please check your email and password.";

      setServerError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />

      {serverError && (
        <p className="mb-4 text-sm text-red-500">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </Button>

      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

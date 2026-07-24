"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

      const data = await loginUser({
        email,
        password,
      });

      console.log("Login successful:", data);

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);

      setServerError(
        error.response?.data?.message ||
          "Login failed. Please check your email and password."
      );
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
    </form>
  );
}
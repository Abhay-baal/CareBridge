"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { registerUser } from "../../services/authService";

export default function RegisterForm() {
  const router = useRouter();

  const [role, setRole] = useState("parent");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
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

      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role,
      };

      const data = await registerUser(payload);

      console.log("Registration successful:", data);

      router.push("/login");
    } catch (error) {
      console.error("Registration failed:", error);

      setServerError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-medium text-gray-700">
          I am registering as
        </p>

        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setRole("parent");
              setErrors({});
              setServerError("");
            }}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
              role === "parent"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Parent
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("child");
              setErrors({});
              setServerError("");
            }}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
              role === "child"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Child
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("provider");
              setErrors({});
              setServerError("");
            }}
            className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
              role === "provider"
                ? "border-blue-600 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Caregiver
          </button>
        </div>
      </div>

      <Input
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={formData.fullName}
        onChange={handleChange}
        name="fullName"
        error={errors.fullName}
      />

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        name="email"
        error={errors.email}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="Enter your 10-digit phone number"
        value={formData.phone}
        onChange={handleChange}
        name="phone"
        error={errors.phone}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Create a password"
        value={formData.password}
        onChange={handleChange}
        name="password"
        error={errors.password}
      />

      {serverError && (
        <p className="mb-4 text-sm text-red-500">
          {serverError}
        </p>
      )}

      <Button type="submit" loading={loading}>
        {role === "parent"
          ? "Create Parent Account"
          : role === "child"
          ? "Create Child Account"
          : "Create Caregiver Account"}
      </Button>
    </form>
  );
}

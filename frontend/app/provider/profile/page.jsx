"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/services/api";

export default function ProviderProfilePage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    bio: "",
    experience: 0,
    services: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get("/providers/me");
        const provider = response?.data?.data;

        if (provider) {
          setForm({
            name: provider.name || "",
            phone: provider.phone || "",
            bio: provider.bio || "",
            experience: provider.experience || 0,
            services: Array.isArray(provider.services)
              ? provider.services.join(", ")
              : "",
          });
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await api.put("/providers/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        experience: Number(form.experience),
        services: form.services
          .split(",")
          .map((service) => service.trim())
          .filter(Boolean),
      });

      const provider = response?.data?.data;

      if (provider) {
        setForm({
          name: provider.name || "",
          phone: provider.phone || "",
          bio: provider.bio || "",
          experience: provider.experience || 0,
          services: Array.isArray(provider.services)
            ? provider.services.join(", ")
            : "",
        });
      }

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-2xl animate-pulse rounded-2xl bg-gray-200 p-10" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

        <Link
          href="/provider/dashboard"
          className="text-sm font-medium text-blue-600"
        >
          ← Dashboard
        </Link>

        <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm sm:p-7">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Provider Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Keep your marketplace information up to date.
          </p>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Name
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Phone
              </label>

              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                inputMode="numeric"
                className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Bio
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-gray-200 p-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Experience
              </label>

              <input
                name="experience"
                type="number"
                min="0"
                value={form.experience}
                onChange={handleChange}
                className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Services
              </label>

              <input
                name="services"
                value={form.services}
                onChange={handleChange}
                placeholder="Hospital Assistance, Elder Care"
                className="mt-2 min-h-11 w-full rounded-xl border border-gray-200 px-4 outline-none focus:border-blue-500"
              />

              <p className="mt-1 text-xs text-gray-500">
                Separate services with commas.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

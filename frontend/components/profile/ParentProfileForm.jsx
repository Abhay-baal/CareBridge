"use client";

import { useEffect, useState } from "react";
import ProfileField from "./ProfileField";
import {
  getParentProfile,
  updateParentProfile,
} from "@/services/parentService";

export default function ParentProfileForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    bloodGroup: "",
    dateOfBirth: "",
    emergencyContact: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getParentProfile();
        const parent = response.data;

        setFormData({
          fullName: parent.user?.fullName || "",
          email: parent.user?.email || "",
          phone: parent.user?.phone || "",
          address: parent.address || "",
          bloodGroup: parent.bloodGroup || "",
          dateOfBirth: parent.dateOfBirth
            ? parent.dateOfBirth.split("T")[0]
            : "",
          emergencyContact: parent.emergencyContact || "",
        });

        setUpdatedAt(parent.updatedAt || "");
      } catch (error) {
        console.error(error);
        setError(
          error.response?.data?.message ||
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

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await updateParentProfile({
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        bloodGroup: formData.bloodGroup,
        dateOfBirth: formData.dateOfBirth,
      });

      setUpdatedAt(
        response.data?.updatedAt ||
          new Date().toISOString()
      );

      setSuccess("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
          "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="motion-card rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-center text-gray-500">
          Loading profile...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">
          {success}
        </div>
      )}

      <div className="motion-card rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Personal Information
        </h2>

        <div className="space-y-4">
          <ProfileField
            label="Full Name"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            disabled
          />

          <ProfileField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            disabled
          />

          <ProfileField
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled
          />
        </div>
      </div>

      <div className="motion-card rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Medical Information
        </h2>

        <div className="space-y-4">
          <ProfileField
            label="Blood Group"
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            placeholder="e.g. O+"
          />

          <ProfileField
            label="Date of Birth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            type="date"
          />

          <ProfileField
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter address"
          />

          <ProfileField
            label="Emergency Contact"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleChange}
            placeholder="Enter emergency contact"
          />
        </div>
      </div>

      {updatedAt && (
        <div className="rounded-2xl bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">
            Last Updated
          </p>

          <p className="mt-1 text-sm text-gray-500">
            {new Date(updatedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="motion-press w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving Changes..." : "Save Changes"}
      </button>
    </form>
  );
}

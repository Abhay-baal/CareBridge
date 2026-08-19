"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/common/PageHeader";
import EmergencyContactCard from "@/components/emergency/EmergencyContactCard";

import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "@/services/emergencyContactService";

const emptyForm = {
  name: "",
  relation: "",
  phone: "",
};

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadContacts = async () => {
    try {
      setError("");

      const response = await getEmergencyContacts();

      setContacts(response.data || []);
    } catch (error) {
      console.error("Emergency contacts error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load emergency contacts"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateEmergencyContact(editingId, form);

        toast.success(
          "Emergency contact updated successfully."
        );
      } else {
        await createEmergencyContact(form);

        toast.success(
          "Emergency contact added successfully."
        );
      }

      resetForm();

      await loadContacts();
    } catch (error) {
      console.error("Save emergency contact error:", error);

      const message =
        error.response?.data?.message ||
        "Failed to save emergency contact";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (contact) => {
    setForm({
      name: contact.name || "",
      relation: contact.relation || "",
      phone: contact.phone || "",
    });

    setEditingId(contact._id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this emergency contact?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteEmergencyContact(id);

      toast.success(
        "Emergency contact deleted successfully."
      );

      await loadContacts();
    } catch (error) {
      console.error("Delete emergency contact error:", error);

      const message =
        error.response?.data?.message ||
        "Failed to delete emergency contact";

      setError(message);
      toast.error(message);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Emergency Contacts"
        subtitle="Manage trusted contacts for your child."
      />

      <div className="mb-5 flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(true);
            }
          }}
          className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add Contact"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            {editingId
              ? "Edit Emergency Contact"
              : "Add Emergency Contact"}
          </h2>

          <div className="space-y-3">
            <input
              required
              type="text"
              placeholder="Full name"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />

            <input
              required
              type="text"
              placeholder="Relation"
              value={form.relation}
              onChange={(event) =>
                setForm({
                  ...form,
                  relation: event.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />

            <input
              required
              type="tel"
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) =>
                setForm({
                  ...form,
                  phone: event.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Contact"
                : "Save Contact"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            Loading emergency contacts...
          </p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-xl">
            📞
          </div>

          <h2 className="font-semibold text-gray-900">
            No Emergency Contacts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add trusted contacts that your child can quickly reach.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <EmergencyContactCard
              key={contact._id}
              contact={contact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </AppLayout>
  );
}

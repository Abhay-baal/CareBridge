/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ContactCard from "@/components/child/ContactCard";
import FamilyContactCard from "@/components/emergency/FamilyContactCard";
import { getMyFamily } from "@/services/familyService";

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

const getFamilyMembers = (family) =>
  [
    { member: family?.father, position: "father" },
    { member: family?.mother, position: "mother" },
    ...(family?.children || []).map((member) => ({
      member,
      position: "child",
    })),
  ].filter(({ member }) => member?._id);

export default function EmergencyPage() {
  const [contacts, setContacts] = useState([]);
  const [family, setFamily] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadContacts = async () => {
    try {
      setError("");

      const [response, familyResponse] = await Promise.all([
        getEmergencyContacts(),
        getMyFamily(),
      ]);

      setContacts(response.data?.data || []);
      setFamily(familyResponse.hasFamily ? familyResponse.data : null);
    } catch (error) {
      console.error("Failed to load emergency contacts:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load emergency contacts."
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

  const handleAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  };

  const handleEdit = (contact) => {
    setForm({
      name: contact.name || "",
      relation: contact.relation || "",
      phone: contact.phone || "",
    });

    setEditingId(contact._id);
    setError("");
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const relation = form.relation.trim();
    const phone = form.phone.trim();

    if (!name || !relation || !phone) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        name,
        relation,
        phone,
      };

      if (editingId) {
        await updateEmergencyContact(editingId, payload);
        toast.success("Emergency contact updated.");
      } else {
        await createEmergencyContact(payload);
        toast.success("Emergency contact added.");
      }

      resetForm();
      await loadContacts();
    } catch (error) {
      console.error("Failed to save emergency contact:", error);

      const message =
        error.response?.data?.message ||
        "Failed to save emergency contact.";

      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this emergency contact?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await deleteEmergencyContact(id);

      toast.success("Emergency contact deleted.");

      if (editingId === id) {
        resetForm();
      }

      await loadContacts();
    } catch (error) {
      console.error("Failed to delete emergency contact:", error);

      const message =
        error.response?.data?.message ||
        "Failed to delete emergency contact.";

      setError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-amber-50/50 p-4 pb-24">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Emergency Contacts
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage important contacts for emergencies.
            </p>
          </div>

          {!showForm && (
            <button
              type="button"
              onClick={handleAdd}
              className="shrink-0 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 active:scale-95"
            >
              + Add
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-5 rounded-2xl border border-rose-100 bg-white/90 p-5 shadow-[0_10px_24px_rgba(251,113,133,0.08)]"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId
                    ? "Edit Emergency Contact"
                    : "Add Emergency Contact"}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Enter the contact details below.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="emergency-name"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Name
                </label>

                <input
                  id="emergency-name"
                  required
                  type="text"
                  placeholder="e.g. Raj Kumar"
                  value={form.name}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-rose-100 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="emergency-relation"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Relation
                </label>

                <input
                  id="emergency-relation"
                  required
                  type="text"
                  placeholder="e.g. Doctor, Neighbour, Uncle"
                  value={form.relation}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      relation: event.target.value,
                    }))
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-rose-100 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-gray-50"
                />
              </div>

              <div>
                <label
                  htmlFor="emergency-phone"
                  className="mb-1.5 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="emergency-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      phone: event.target.value,
                    }))
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-rose-100 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 disabled:bg-gray-50"
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
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

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />

            <p className="mt-3 text-sm text-gray-500">
              Loading emergency contacts...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-lg font-bold text-rose-950">
                Family Contacts
              </h2>
              <div className="space-y-3">
                {getFamilyMembers(family).length > 0 ? (
                  getFamilyMembers(family).map(({ member, position }) => (
                    <FamilyContactCard
                      key={member._id}
                      member={member}
                      position={position}
                    />
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
                    No family members connected yet.
                  </p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-rose-950">
                Other Contacts
              </h2>
              {contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <ContactCard
                      key={contact._id}
                      contact={contact}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      deleting={deletingId === contact._id}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
                  No other contacts added.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

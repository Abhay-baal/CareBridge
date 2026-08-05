/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ContactCard from "@/components/child/ContactCard";

import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "@/services/childService";

export default function EmergencyPage() {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  const loadContacts = async () => {
    try {
      setError("");

      const response = await getEmergencyContacts();

      setContacts(response.data || []);
    } catch (error) {
      console.error(error);

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (editingId) {
        await updateEmergencyContact(editingId, form);
        toast.success("Contact updated successfully.");
      } else {
        await createEmergencyContact(form);
        toast.success("Contact added successfully.");
      }

      setForm({
        name: "",
        relation: "",
        phone: "",
      });

      setEditingId(null);
      setShowForm(false);

      await loadContacts();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to save contact"
      );

      toast.error(
        "Something went wrong. Please try again."
      );
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
  };

  const handleDelete = async (id) => {
    try {
      setError("");

      await deleteEmergencyContact(id);

      toast.success("Contact deleted successfully.");

      await loadContacts();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Failed to delete contact"
      );

      toast.error(
        "Something went wrong. Please try again."
      );
    }
  };

  const handleCancel = () => {
    setForm({
      name: "",
      relation: "",
      phone: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Emergency Contacts
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage important contacts.
            </p>
          </div>

          <button
            onClick={() => {
              if (showForm) {
                handleCancel();
              } else {
                setShowForm(true);
              }
            }}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-4 space-y-3 rounded-2xl bg-white p-5 shadow-sm"
          >
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
            />

            <input
              required
              placeholder="Relation"
              value={form.relation}
              onChange={(e) =>
                setForm({
                  ...form,
                  relation: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
            />

            <input
              required
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Contact"
                : "Save Contact"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              Loading contacts...
            </p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-gray-500">
              No emergency contacts added.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <ContactCard
                key={contact._id}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

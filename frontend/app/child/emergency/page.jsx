"use client";

import { useState } from "react";
import ContactCard from "@/components/child/ContactCard";

export default function EmergencyPage() {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    relation: "",
    phone: "",
  });

  function handleSubmit(event) {
    event.preventDefault();

    const newContact = {
      _id: Date.now().toString(),
      ...form,
    };

    setContacts((current) => [...current, newContact]);

    setForm({
      name: "",
      relation: "",
      phone: "",
    });

    setShowForm(false);
  }

  function handleDelete(id) {
    setContacts((current) =>
      current.filter((contact) => contact._id !== id)
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
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
            onClick={() => setShowForm((value) => !value)}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            + Add
          </button>
        </div>

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
                setForm({ ...form, name: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
            />

            <input
              required
              placeholder="Relation"
              value={form.relation}
              onChange={(e) =>
                setForm({ ...form, relation: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
            />

            <input
              required
              type="tel"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3"
            />

            <button
              type="submit"
              className="w-full rounded-xl bg-green-600 px-4 py-3 font-medium text-white"
            >
              Save Contact
            </button>
          </form>
        )}

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
              <p className="text-sm text-gray-500">
                No emergency contacts added.
              </p>
            </div>
          ) : (
            contacts.map((contact) => (
              <ContactCard
                key={contact._id}
                contact={contact}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}

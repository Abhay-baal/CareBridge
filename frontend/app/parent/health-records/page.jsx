/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AppLayout from "@/components/layout/AppLayout";
import {
  getHealthRecords,
  uploadHealthRecord,
  deleteHealthRecord,
} from "@/services/healthRecordService";

export default function HealthRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "Medical Report",
    file: null,
  });

  const loadRecords = async () => {
    try {
      setLoading(true);

      const response = await getHealthRecords();

      setRecords(response.data || []);
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Unable to load health records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Please enter a report name.");
      return;
    }

    if (!form.file) {
      toast.error("Please choose a file.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("title", form.title);
      formData.append("category", form.category);
      formData.append("file", form.file);

      await uploadHealthRecord(formData);

      setForm({
        title: "",
        category: "Medical Report",
        file: null,
      });

      event.target.reset();

      await loadRecords();

      toast.success("Report uploaded successfully.");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Unable to upload report. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    try {
      await deleteHealthRecord(id);

      setRecords((current) =>
        current.filter((record) => record._id !== id)
      );

      toast.success("Report deleted successfully.");
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          "Unable to delete report."
      );
    }
  };

  const getFileLabel = (record) => {
    const type = record.fileType || "";

    if (type.includes("pdf")) return "PDF";
    if (type.includes("png")) return "PNG";
    if (type.includes("jpeg") || type.includes("jpg")) {
      return "JPG";
    }

    return "FILE";
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Health Records
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          Access and manage medical reports in one place.
        </p>
      </div>

      <form
        onSubmit={handleUpload}
        className="mb-6 rounded-2xl bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Upload Report
        </h2>

        <div className="mt-4 space-y-3">
          <input
            required
            type="text"
            placeholder="Report Name"
            value={form.title}
            onChange={(event) =>
              setForm({
                ...form,
                title: event.target.value,
              })
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />

          <select
            value={form.category}
            onChange={(event) =>
              setForm({
                ...form,
                category: event.target.value,
              })
            }
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm"
          >
            <option>Medical Report</option>
            <option>Blood Test</option>
            <option>Prescription</option>
            <option>MRI Scan</option>
            <option>X-Ray</option>
            <option>Other</option>
          </select>

          <input
            required
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={(event) =>
              setForm({
                ...form,
                file: event.target.files?.[0] || null,
              })
            }
            className="w-full rounded-xl border border-gray-200 p-3 text-sm"
          />

          <p className="text-xs text-gray-400">
            Supported: PDF, PNG, JPG, JPEG. Maximum 10MB.
          </p>

          <button
            type="submit"
            disabled={uploading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload Report"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <>
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl bg-white p-5 shadow-sm"
              >
                <div className="h-4 w-1/2 rounded bg-gray-200" />
                <div className="mt-3 h-3 w-1/3 rounded bg-gray-200" />
                <div className="mt-4 h-9 w-full rounded bg-gray-200" />
              </div>
            ))}
          </>
        ) : records.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <div className="text-4xl">📄</div>

            <h3 className="mt-3 font-semibold text-gray-900">
              No health records yet.
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Upload the first report to get started.
            </p>
          </div>
        ) : (
          records.map((record) => (
            <div
              key={record._id}
              className="rounded-2xl bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {record.title}
                  </h3>

                  <p className="mt-1 text-sm text-gray-500">
                    {record.category} · {getFileLabel(record)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Uploaded{" "}
                    {new Date(
                      record.createdAt
                    ).toLocaleDateString("en-IN")}
                  </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                  {getFileLabel(record)}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <a
                  href={record.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-blue-50 px-3 py-2 text-center text-sm font-medium text-blue-600 hover:bg-blue-100"
                >
                  Preview
                </a>

                <a
                  href={record.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-gray-100 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Download
                </a>

                <button
                  type="button"
                  onClick={() =>
                    handleDelete(record._id)
                  }
                  className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}

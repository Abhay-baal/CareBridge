"use client";

export default function WelcomeHeader({ parentName = "Parent" }) {
  return (
    <div className="mb-5">
      <p className="text-sm text-gray-500">Child Dashboard</p>
      <h1 className="text-2xl font-bold text-gray-900">
        Hello 👋
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Here’s an overview of {parentName}'s health.
      </p>
    </div>
  );
}

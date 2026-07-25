import AppLayout from "@/components/layout/AppLayout";

export default function ProfilePage() {
  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-gray-900">
        Profile
      </h1>

      <p className="mt-2 text-gray-600">
        Your profile will appear here.
      </p>
    </AppLayout>
  );
}
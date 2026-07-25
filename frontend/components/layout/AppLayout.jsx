import BottomNavigation from "@/components/dashboard/BottomNavigation";

export default function AppLayout({ children }) {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="mx-auto max-w-md px-4 py-4">
        {children}
      </div>

      <BottomNavigation />
    </main>
  );
}
import ChildNavigation from "@/components/child/ChildNavigation";

export default function ChildLayout({ children }) {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {children}

      <ChildNavigation />
    </main>
  );
}

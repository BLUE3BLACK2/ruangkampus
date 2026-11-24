
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
                {/* Sidebar */}
                <div className="h-screen shrink-0 overflow-hidden">
                    <AdminSidebar />
                </div>

                {/* Main Content */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <div className="shrink-0">
                        <AdminHeader />
                    </div>

                    {/* Page Content */}
                    <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}

import React, { useState, useEffect } from 'react';
import { useSpec } from '@/hooks/useSpec';
import Sidebar from "@/components/layouts/Sidebar";
import { Outlet, useLocation } from "@tanstack/react-router";
import MinimifiedInfo from "@/components/layouts/MinimifiedInfo";
import LayoutSkeleton from '@/components/Skeletons/LayoutSkeleton';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SkuseDocumentationProps {
    openApiUrl: string;
}

export const SkuseDocumentation: React.FC<SkuseDocumentationProps> = ({ openApiUrl }) => {
    const { spec, error, loading } = useSpec({ openApiUrl });
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on navigation (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    if (loading) return <LayoutSkeleton />;
    if (error) return <div>Erreur : {error.message}</div>;
    if (!spec) return null;

    const showMinimifiedInfo = location.pathname !== '/';

    return (
        <div className="h-screen flex flex-col">
            <div className="flex flex-1 overflow-hidden">
                {/* Mobile backdrop — starts below the navbar (top-16) */}
                {sidebarOpen && (
                    <div
                        className="fixed top-16 inset-x-0 bottom-0 bg-black/40 z-30 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <div className={cn(
                    "overflow-y-auto bg-background transition-transform duration-300 ease-in-out",
                    "fixed top-16 bottom-0 left-0 w-72 z-40 shadow-2xl rounded-r-xl border-r md:rounded-r-none md:shadow-none",
                    "md:sticky md:top-0 md:h-screen md:w-80 md:z-auto md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    <Sidebar />
                </div>

                <div className="flex-1 overflow-y-auto flex flex-col min-w-0">
                    {showMinimifiedInfo && (
                        <MinimifiedInfo onToggleSidebar={() => setSidebarOpen(o => !o)} />
                    )}

                    {/* Mobile header on home page */}
                    {!showMinimifiedInfo && (
                        <div className="md:hidden sticky top-0 z-50 bg-muted/60 backdrop-blur-md shadow-sm flex items-center gap-2 px-4 py-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                onClick={() => setSidebarOpen(o => !o)}
                            >
                                <Menu className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-semibold truncate">{spec.info.title}</span>
                        </div>
                    )}

                    <div className="p-0 md:p-4 flex-1">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { OpenAPIProvider } from '@/hooks/OpenAPIContext';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router/routes';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider storageKey="skuse-ui-theme">
            <TooltipProvider delayDuration={300}>
                <OpenAPIProvider>
                    <RouterProvider router={router} />
                    <Toaster richColors closeButton position="bottom-right" />
                </OpenAPIProvider>
            </TooltipProvider>
        </ThemeProvider>
    </StrictMode>
)
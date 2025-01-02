import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { OpenAPIProvider } from '@/hooks/OpenAPIContext';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router/routes';
import {ThemeProvider} from "@/components/theme-provider";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider storageKey="skuse-ui-theme">
            <OpenAPIProvider>
                <RouterProvider router={router} />
            </OpenAPIProvider>
        </ThemeProvider>
    </StrictMode>
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { OpenAPIProvider } from '@/hooks/OpenAPIContext';
import { RouterProvider } from '@tanstack/react-router';
import { router } from '@/router/routes';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <OpenAPIProvider>
            <RouterProvider router={router} />
        </OpenAPIProvider>
    </StrictMode>
)
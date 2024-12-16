import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SkuseDocumentation } from "./SkuseDocumentation";
import { OpenAPIProvider } from '@/hooks/OpenAPIContext';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <OpenAPIProvider>
            {/* See examples to test doc : https://apis.guru/ */}
            <SkuseDocumentation openApiUrl={"https://api.apis.guru/v2/specs/asana.com/1.0/openapi.json"} />
        </OpenAPIProvider>
    </StrictMode>
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SkuseDocumentation } from './SkuseDocumentation'

// See https://apis.guru/ for test specs
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <SkuseDocumentation openApiUrl="https://api.apis.guru/v2/specs/bunq.com/1.0/openapi.json" />
    </StrictMode>
)

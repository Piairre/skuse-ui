import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SkuseDocumentation } from "./SkuseDocumentation";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <SkuseDocumentation openApiUrl={"https://localhost/docs.jsonopenapi"} />
  </StrictMode>,
)

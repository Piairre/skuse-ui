import React from 'react';
import ReactDOM from 'react-dom/client';
import { SkuseDocumentation, SkuseDocumentationProps } from './SkuseDocumentation';
import './index.css';

export function mount(selector: string, options: SkuseDocumentationProps): void {
    const el = document.querySelector(selector);
    if (!el) {
        console.error(`[SkuseUI] Element not found: ${selector}`);
        return;
    }
    ReactDOM.createRoot(el as HTMLElement).render(
        React.createElement(SkuseDocumentation, { ...options, routerMode: 'hash' })
    );
}

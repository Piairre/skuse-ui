import {
    Route,
    RootRoute,
    Router,
    createHashHistory,
} from '@tanstack/react-router';
import Information from '@/components/openapi/Information';
import { DocumentationShell } from "@/SkuseDocumentation";
import EndpointDetails from "@/components/openapi/Endpoint/EndpointDetails";
import Models from "@/components/openapi/Models";
import WebhookDetails from "@/components/openapi/WebhookDetails";

export function createAppRouter(routerMode: 'browser' | 'hash' = 'browser') {
    const rootRoute = new RootRoute({
        component: DocumentationShell,
    });

    const indexRoute = new Route({
        getParentRoute: () => rootRoute,
        path: '/',
        component: Information
    });

    const endpointRoute = new Route({
        getParentRoute: () => rootRoute,
        path: '/$tag/$operationId',
        component: EndpointDetails
    });

    const modelsRoute = new Route({
        getParentRoute: () => rootRoute,
        path: '/models',
        component: Models
    });

    const webhookRoute = new Route({
        getParentRoute: () => rootRoute,
        path: '/webhooks/$webhookName/$operationId',
        component: WebhookDetails
    });

    const routeTree = rootRoute.addChildren([indexRoute, endpointRoute, modelsRoute, webhookRoute]);

    return new Router({
        routeTree,
        ...(routerMode === 'hash' ? { history: createHashHistory() } : {}),
    });
}

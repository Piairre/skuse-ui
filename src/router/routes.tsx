import {
    Route,
    RootRoute,
    Router
} from '@tanstack/react-router';
import Information from '@/components/openapi/Information';
import { SkuseDocumentation } from "@/SkuseDocumentation";
import EndpointDetails from "@/components/openapi/Endpoint/EndpointDetails";
import Models from "@/components/openapi/Models";
import WebhookDetails from "@/components/openapi/WebhookDetails";

const rootRoute = new RootRoute({
    component: () => (
        // See examples to test doc : https://apis.guru/
        <SkuseDocumentation openApiUrl={"https://demo.api-platform.com/docs.jsonopenapi"} />
    )
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

export const router = new Router({ routeTree });
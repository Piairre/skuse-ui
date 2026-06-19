import {
    Route,
    RootRoute,
    Router
} from '@tanstack/react-router';
import Information from '@/components/openapi/Information';
import { SkuseDocumentation } from "@/SkuseDocumentation";
import EndpointDetails from "@/components/openapi/Endpoint/EndpointDetails";
import Models from "@/components/openapi/Models";

const rootRoute = new RootRoute({
    component: () => (
        // See examples to test doc : https://apis.guru/
        <SkuseDocumentation openApiUrl={"/test-spec.json"} />
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

const routeTree = rootRoute.addChildren([indexRoute, endpointRoute, modelsRoute]);

export const router = new Router({ routeTree });
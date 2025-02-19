import {
    Route,
    RootRoute,
    Router
} from '@tanstack/react-router';
import Information from '@/components/openapi/Information';
import { SkuseDocumentation } from "@/SkuseDocumentation";
import EndpointDetails from "@/components/openapi/Endpoint/EndpointDetails";

const rootRoute = new RootRoute({
    component: () => (
        // See examples to test doc : https://apis.guru/
        <SkuseDocumentation openApiUrl={"https://api.apis.guru/v2/specs/bunq.com/1.0/openapi.json"} />
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

const routeTree = rootRoute.addChildren([indexRoute, endpointRoute]);

export const router = new Router({ routeTree });
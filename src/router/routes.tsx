import {
    Route,
    RootRoute,
    Router
} from '@tanstack/react-router';
import Information from '@/components/openapi/Information';
import {SkuseDocumentation} from "@/SkuseDocumentation";
import EndpointDetails from "@/components/openapi/Endpoint/EndpointDetails";
import { findOperationByOperationIdAndTag } from '@/utils/openapi';
import {EnhancedOperationObject} from "@/types/openapi";

interface EndpointParams {
    tag?: string;
    operationId: string;
}

const rootRoute = new RootRoute({
    // See examples to test doc : https://apis.guru/
    component: () => {
        return <SkuseDocumentation openApiUrl={"https://api.apis.guru/v2/specs/bunq.com/1.0/openapi.json"} />;
    }
});

const indexRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => {
        return <Information />;
    }
});

// Endpoint routes
const endpointRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/$tag/$operationId',
    component: () => {
        const { tag, operationId } = endpointRoute.useParams();

        let operation = findOperationByOperationIdAndTag(operationId, tag);

        // TODO: Add a 404 page if operation is not found
        return <EndpointDetails operation={operation as EnhancedOperationObject} />;
    }
});

const endpointRouteUntagged = new Route({
    getParentRoute: () => rootRoute,
    path: '/$operationId',
    component: () => {
        const { operationId }: EndpointParams = endpointRouteUntagged.useParams();
        let operation = findOperationByOperationIdAndTag(operationId);

        // TODO: Add a 404 page if operation is not found
        return <EndpointDetails operation={operation as EnhancedOperationObject} />;
    }
});

const routeTree = rootRoute.addChildren([indexRoute, endpointRoute, endpointRouteUntagged]);

export const router = new Router({ routeTree });
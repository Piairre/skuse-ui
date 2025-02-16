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
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";
import {OpenAPIV3} from "openapi-types";
import Document = OpenAPIV3.Document;

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
        const spec = useOpenAPIContext().spec as Document;

        let operation = findOperationByOperationIdAndTag(spec, operationId, tag);

        // TODO: Add a 404 page if operation is not found
        return <EndpointDetails operation={operation as EnhancedOperationObject} />;
    }
});

const endpointRouteUntagged = new Route({
    getParentRoute: () => rootRoute,
    path: '/$operationId',
    component: () => {
        const { operationId }: EndpointParams = endpointRouteUntagged.useParams();

        const spec = useOpenAPIContext().spec as Document;
        let operation = findOperationByOperationIdAndTag(spec, operationId);

        // TODO: Add a 404 page if operation is not found
        return <EndpointDetails operation={operation as EnhancedOperationObject} />;
    }
});

const routeTree = rootRoute.addChildren([indexRoute, endpointRoute, endpointRouteUntagged]);

export const router = new Router({ routeTree });
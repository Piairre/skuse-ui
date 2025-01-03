import {
    Route,
    RootRoute,
    Router, useNavigate
} from '@tanstack/react-router';
import Information from '@/components/openapi/Information';
import {SkuseDocumentation} from "@/SkuseDocumentation";
import EndpointDetails from "@/components/openapi/EndpointDetails";
import { findOperationByOperationIdAndTag } from '@/utils/openapi';

interface EndpointParams {
    tag?: string;
    operationId: string;
}

const rootRoute = new RootRoute({
    // See examples to test doc : https://apis.guru/
    component: () => {
        return <SkuseDocumentation openApiUrl={"https://demo.api-platform.com/docs.jsonopenapi"} />;
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

        return <EndpointDetails operation={operation} />;
    }
});

const endpointRouteUntagged = new Route({
    getParentRoute: () => rootRoute,
    path: '/$operationId',
    component: () => {
        const { operationId }: EndpointParams = endpointRouteUntagged.useParams();

        let operation = findOperationByOperationIdAndTag(operationId);

        return <EndpointDetails operation={operation} />;
    }
});

const routeTree = rootRoute.addChildren([indexRoute, endpointRoute, endpointRouteUntagged]);

export const router = new Router({ routeTree });
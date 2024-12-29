import {
    Route,
    RootRoute,
    Router
} from '@tanstack/react-router';
import Header from '@/components/openapi/Header';
import {SkuseDocumentation} from "@/SkuseDocumentation";

const rootRoute = new RootRoute({
    // See examples to test doc : https://apis.guru/
    component: () => {
        return <SkuseDocumentation openApiUrl={"https://api.apis.guru/v2/specs/github.com/1.1.4/openapi.json"} />;
    }
});

// Route pour la page d'accueil
const indexRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => {
        return <Header />;
    }
});

// Route pour les endpoints
const endpointRoute = new Route({
    getParentRoute: () => rootRoute,
    path: '/endpoints/$tag/$method/$path',
    component: () => {
        return (
            <div>
                <h1>Endpoint Details</h1>
                <pre>Pierre</pre>
            </div>
        );
    }
});

const routeTree = rootRoute.addChildren([indexRoute, endpointRoute]);

export const router = new Router({ routeTree });
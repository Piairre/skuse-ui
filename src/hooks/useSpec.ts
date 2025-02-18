import { useEffect } from 'react';
import { useOpenAPIContext } from './OpenAPIContext';
import { resolveOpenAPIDocument } from "@/utils/openapi";
import {OpenAPIInputDocument, ServerObject, UnifiedOpenAPI} from "@/types/unified-openapi-types";

const getCurrentUrl = () => `${window.location.protocol}//${window.location.host}`;

const calculateInitialUrl = (spec: UnifiedOpenAPI) => {
    if (!spec.servers || spec.servers.length === 0) {
        return getCurrentUrl();
    }

    const firstServer = spec.servers[0] as ServerObject;
    let url = firstServer.url;

    if (url === '/') {
        return getCurrentUrl();
    }

    if (firstServer.variables) {
        Object.entries(firstServer.variables).forEach(([key, value]) => {
            url = url.replace(`{${key}}`, value.default || '');
        });
    }

    return url;
};

export function useSpec({ openApiUrl }: { openApiUrl: string }) {
    const {
        spec,
        setSpec,
        loading,
        setLoading,
        error,
        setError,
        setComputedUrl,
        setServerVariables
    } = useOpenAPIContext();

    useEffect(() => {
        async function fetchSpec() {
            try {
                setLoading(true);
                const response = await fetch(openApiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error ! Status: ${response.status}`);
                }

                const rawSpec: OpenAPIInputDocument = await response.json();
                const resolvedSpec = resolveOpenAPIDocument(rawSpec);

                if (resolvedSpec?.info?.title) {
                    document.title = `${resolvedSpec.info.title} - Skuse UI`;
                } else {
                    document.title = 'API Docs - Skuse UI';
                }

                const initialUrl = calculateInitialUrl(resolvedSpec);
                setComputedUrl(initialUrl);

                if (resolvedSpec.servers?.[0]?.variables) {
                    const defaultVars: Record<string, string> = {};
                    Object.entries(resolvedSpec.servers[0].variables).forEach(([key, value]) => {
                        defaultVars[key] = value.default || '';
                    });
                    setServerVariables(defaultVars);
                }

                setSpec(resolvedSpec);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('An error occurred while fetching the Swagger documentation'));
            } finally {
                setLoading(false);
            }
        }

        fetchSpec();
    }, [openApiUrl, setSpec, setLoading, setError, setComputedUrl, setServerVariables]);

    return { spec, loading, error };
}
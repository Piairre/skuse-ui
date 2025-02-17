import { useEffect } from 'react';
import { useOpenAPIContext } from './OpenAPIContext';
import {resolveOpenAPIDocument} from "@/utils/openapi";
import {OpenAPIInputDocument} from "@/types/unified-openapi-types";

export function useSpec({ openApiUrl }: { openApiUrl: string }) {
    const {
        spec,
        setSpec,
        loading,
        setLoading,
        error,
        setError
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

                if (spec?.info?.title) {
                    document.title = `${spec.info.title} - Skuse UI`;
                } else {
                    document.title = 'API Docs - Skuse UI';
                }

                setSpec(resolvedSpec);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('An error occurred while fetching the Swagger documentation'));
            } finally {
                setLoading(false);
            }
        }

        fetchSpec();
    }, [openApiUrl, setSpec, setLoading, setError]);

    return { spec, loading, error };
}
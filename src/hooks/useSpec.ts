import { useState, useEffect } from 'react';
import { OpenAPIV3 } from 'openapi-types';
import { useOpenAPIContext } from './OpenAPIContext';

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

                const swaggerDoc: OpenAPIV3.Document = await response.json();
                setSpec(swaggerDoc);
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
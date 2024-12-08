import { useState, useEffect } from 'react';
import { OpenAPIV3 } from 'openapi-types';

export interface SwaggerClientOptions {
    openApiUrl: string;
}

export interface UseSwaggerClientResult {
    spec: OpenAPIV3.Document | null;
    loading: boolean;
    error: Error | null;
}

export function useSwaggerClient({ openApiUrl }: SwaggerClientOptions): UseSwaggerClientResult {
    const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchSwaggerDocumentation() {
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

        fetchSwaggerDocumentation();
    }, [openApiUrl]);

    return {
        spec,
        loading,
        error
    };
}
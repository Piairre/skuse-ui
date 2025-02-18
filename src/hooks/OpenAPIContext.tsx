import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UnifiedOpenAPI } from "@/types/unified-openapi-types";

// Provide a default value for the context
const defaultSpec: UnifiedOpenAPI = {
    info: {
        title: 'API Documentation',
        version: '1.0.0',
    },
    paths: {}
};

interface OpenAPIContextType {
    spec: UnifiedOpenAPI;
    setSpec: (spec: UnifiedOpenAPI) => void;
    computedUrl: string;
    setComputedUrl: (url: string) => void;
    serverVariables: Record<string, string>;
    setServerVariables: (variables: Record<string, string>) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: Error | null;
    setError: (error: Error | null) => void;
}

const OpenAPIContext = createContext<OpenAPIContextType>({
    spec: defaultSpec,
    setSpec: () => {},
    computedUrl: '',
    setComputedUrl: () => {},
    serverVariables: {},
    setServerVariables: () => {},
    loading: false,
    setLoading: () => {},
    error: null,
    setError: () => {}
});

export const OpenAPIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [spec, setSpec] = useState<UnifiedOpenAPI>(defaultSpec);
    const [computedUrl, setComputedUrl] = useState<string>('');
    const [serverVariables, setServerVariables] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    return (
        <OpenAPIContext.Provider
            value={{
                spec,
                setSpec,
                computedUrl,
                setComputedUrl,
                serverVariables,
                setServerVariables,
                loading,
                setLoading,
                error,
                setError
            }}
        >
            {children}
        </OpenAPIContext.Provider>
    );
};

export const useOpenAPIContext = () => {
    const context = useContext(OpenAPIContext);

    if (!context) {
        throw new Error('useOpenAPIContext must be used within an OpenAPIProvider');
    }

    return context;
};
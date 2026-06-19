import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UnifiedOpenAPI, AuthCredential } from "@/types/unified-openapi-types";

const STORAGE_KEY = 'skuse_auth_credentials';
const CONTENT_TYPE_KEY = 'skuse_preferred_content_type';

const loadCredentials = (): Record<string, AuthCredential> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
};

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
    credentials: Record<string, AuthCredential>;
    setCredential: (schemeName: string, credential: AuthCredential) => void;
    clearCredential: (schemeName: string) => void;
    preferredContentType: string | null;
    setPreferredContentType: (ct: string) => void;
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
    setError: () => {},
    credentials: {},
    setCredential: () => {},
    clearCredential: () => {},
    preferredContentType: null,
    setPreferredContentType: () => {},
});

export const OpenAPIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [spec, setSpec] = useState<UnifiedOpenAPI>(defaultSpec);
    const [computedUrl, setComputedUrl] = useState<string>('');
    const [serverVariables, setServerVariables] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);
    const [credentials, setCredentials] = useState<Record<string, AuthCredential>>(loadCredentials);
    const [preferredContentType, setPreferredContentType] = useState<string | null>(
        () => localStorage.getItem(CONTENT_TYPE_KEY)
    );

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    }, [credentials]);

    const setCredential = (schemeName: string, credential: AuthCredential) => {
        setCredentials(prev => ({ ...prev, [schemeName]: credential }));
    };

    const clearCredential = (schemeName: string) => {
        setCredentials(prev => {
            const next = { ...prev };
            delete next[schemeName];
            return next;
        });
    };

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
                setError,
                credentials,
                setCredential,
                clearCredential,
                preferredContentType,
                setPreferredContentType: (ct: string) => {
                    localStorage.setItem(CONTENT_TYPE_KEY, ct);
                    setPreferredContentType(ct);
                },
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
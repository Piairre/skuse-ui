import React, { createContext, useState, useContext, ReactNode } from 'react';
import { OpenAPIV3 } from 'openapi-types';

interface OpenAPIContextType {
    spec: OpenAPIV3.Document | null;
    setSpec: (spec: OpenAPIV3.Document | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: Error | null;
    setError: (error: Error | null) => void;
}

const OpenAPIContext = createContext<OpenAPIContextType>({
    spec: null,
    setSpec: () => {},
    loading: false,
    setLoading: () => {},
    error: null,
    setError: () => {}
});

export const OpenAPIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [spec, setSpec] = useState<OpenAPIV3.Document | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    return (
        <OpenAPIContext.Provider
            value={{
                spec,
                setSpec,
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
import { createContext } from 'react';

export interface SchemaExpandContextValue {
    version: number;
    allOpen: boolean;
    dispatch?: (allOpen: boolean) => void;
}

export const SchemaExpandContext = createContext<SchemaExpandContextValue | null>(null);

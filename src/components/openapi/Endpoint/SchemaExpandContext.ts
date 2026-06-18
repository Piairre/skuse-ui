import { createContext } from 'react';

export interface SchemaExpandContextValue {
    version: number;
    allOpen: boolean;
}

export const SchemaExpandContext = createContext<SchemaExpandContextValue | null>(null);

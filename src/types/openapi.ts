import { OpenAPIV3 } from 'openapi-types';

export interface EnhancedOperationObject extends OpenAPIV3.OperationObject {
    path: string;
    method: Uppercase<OpenAPIV3.HttpMethods>;
}

export type TaggedOperationsMap = Record<string, EnhancedOperationObject[]>;
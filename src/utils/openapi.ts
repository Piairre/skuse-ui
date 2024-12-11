import { OpenAPIV3 } from 'openapi-types';
import { EnhancedOperationObject, TaggedOperationsMap } from '@/types/openapi';

export function groupEndpointsByTags(paths: OpenAPIV3.PathsObject): TaggedOperationsMap {
    const tagMap: TaggedOperationsMap = {};

    const httpMethods = Object.values(OpenAPIV3.HttpMethods) as string[];

    function pushToTag(tag: string | null, operation: OpenAPIV3.OperationObject, path: string, method: string) {
        if (!tagMap[tag]) {
            tagMap[tag] = [];
        }

        const enhancedOperation: EnhancedOperationObject = {
            ...operation,
            path,
            method: method.toUpperCase() as Uppercase<OpenAPIV3.HttpMethods>
        };

        tagMap[tag].push(enhancedOperation);
    }

    Object.entries(paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
            if (httpMethods.includes(method)) {
                const typedOperation = operation as OpenAPIV3.OperationObject;
                const tag = typedOperation.tags && typedOperation.tags.length > 0
                    ? typedOperation.tags[0]
                    : null;

                pushToTag(tag, typedOperation, path, method);
            }
        });
    });

    return tagMap;
}
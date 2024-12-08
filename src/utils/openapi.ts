import { OpenAPIV3 } from 'openapi-types';

export function groupEndpointsByTags(paths: OpenAPIV3.PathsObject): Record<string, OpenAPIV3.OperationObject[]> {
    const tagMap: Record<string, OpenAPIV3.OperationObject[]> = {};

    Object.entries(paths).forEach(([path, pathItem]) => {
        Object.entries(pathItem).forEach(([method, operation]) => {
            const typedOperation = operation as OpenAPIV3.OperationObject;

            if (typedOperation.tags && typedOperation.tags.length > 0) {
                typedOperation.tags.forEach(tagName => {
                    if (!tagMap[tagName]) {
                        tagMap[tagName] = [];
                    }

                    const enhancedOperation = {
                        ...typedOperation,
                        path,
                        method: method.toUpperCase()
                    };

                    tagMap[tagName].push(enhancedOperation);
                });
            }
        });
    });

    return tagMap;
}
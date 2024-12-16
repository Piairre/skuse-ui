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


// References resolver
type ReferenceObject = { $ref: string };

function isReferenceObject(obj: any): obj is ReferenceObject {
    return obj && typeof obj === 'object' && '$ref' in obj;
}

function resolveReference<T>(
    obj: T | ReferenceObject,
    rootDocument: OpenAPIV3.Document
): T {
    // If it's not a reference object, return as is
    if (!isReferenceObject(obj)) return obj;

    const refPath = obj.$ref.split('/').slice(1);

    let resolvedObj = rootDocument;

    try {
        for (const pathPart of refPath) {
            resolvedObj = resolvedObj[pathPart];
        }
    } catch (error) {
        throw new Error(`Can't resolve reference : ${obj.$ref}`);
    }

    if (resolvedObj === undefined) {
        throw new Error(`Reference not found : ${obj.$ref}`);
    }

    return resolveReference(resolvedObj, rootDocument) as T;
}

function resolveReferences<T>(
    obj: T,
    rootDocument: OpenAPIV3.Document
): T {
    if (obj === null || typeof obj !== 'object') return obj;

    if (isReferenceObject(obj)) {
        return resolveReference(obj, rootDocument);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => resolveReferences(item, rootDocument)) as T;
    }

    if (typeof obj === 'object') {
        const resolvedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
            resolvedObj[key] = resolveReferences(value, rootDocument);
        }
        return resolvedObj;
    }

    return obj;
}

export { resolveReference, resolveReferences };
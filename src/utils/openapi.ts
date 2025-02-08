import { OpenAPIV3 } from 'openapi-types';
import { EnhancedOperationObject, TaggedOperationsMap } from '@/types/openapi';
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";

const validHttpMethods = new Set<OpenAPIV3.HttpMethods>(Object.values(OpenAPIV3.HttpMethods));

function isValidHttpMethod(method: string): method is OpenAPIV3.HttpMethods {
    return validHttpMethods.has(method.toLowerCase() as OpenAPIV3.HttpMethods);
}

function groupEndpointsByTags(paths: OpenAPIV3.PathsObject): TaggedOperationsMap {
    const tagMap: TaggedOperationsMap = {};

    function pushToTag(tag: string | undefined, operation: OpenAPIV3.OperationObject, path: string, method: string) {
        const normalizedTag = tag || 'null';
        if (!tagMap[normalizedTag]) {
            tagMap[normalizedTag] = [];
        }

        const enhancedOperation: EnhancedOperationObject = {
            ...operation,
            path,
            method: method.toUpperCase() as Uppercase<OpenAPIV3.HttpMethods>
        };

        tagMap[normalizedTag].push(enhancedOperation);
    }

    Object.entries(paths).forEach(([path, pathItem]) => {
        if (pathItem) {
            Object.entries(pathItem).forEach(([method, operation]) => {
                if (isValidHttpMethod(method)) {
                    const typedOperation = operation as OpenAPIV3.OperationObject;
                    const tag = typedOperation.tags && typedOperation.tags.length > 0
                        ? typedOperation.tags[0]
                        : 'null';

                    pushToTag(tag, typedOperation, path, method);
                }
            });
        }
    });

    return tagMap;
}

function findOperationByOperationIdAndTag(
    operationId: string,
    tag?: string
): EnhancedOperationObject | null {
    const spec = useOpenAPIContext().spec;

    if (!spec) return null;

    const groupedEndpointsByTag = groupEndpointsByTags(spec.paths as Record<string, OpenAPIV3.PathItemObject>);

    const tagEndpoints = groupedEndpointsByTag[tag || 'null'];
    if (!tagEndpoints) return null;

    return tagEndpoints.find(endpoint => endpoint.operationId === operationId) || null;
}

function getBadgeColor(httpMethod: string): string {
    const httpMethodColors: Record<OpenAPIV3.HttpMethods, string> = {
        get: 'bg-green-500',
        post: 'bg-blue-500',
        put: 'bg-yellow-500',
        patch: 'bg-teal-500',
        delete: 'bg-red-500',
        options: 'bg-purple-500',
        head: 'bg-gray-500',
        trace: 'bg-pink-500'
    };

    return httpMethodColors[httpMethod.toLowerCase() as OpenAPIV3.HttpMethods] || 'bg-gray-500';
}

// Types plus précis pour les références
interface ReferenceObject {
    $ref: string;
}

function isReferenceObject(obj: unknown): obj is ReferenceObject {
    return obj !== null && typeof obj === 'object' && '$ref' in obj;
}

type SchemaObjectWithoutRef = Omit<OpenAPIV3.SchemaObject, '$ref'>;

type ResolvedType<T> = T extends ReferenceObject
    ? SchemaObjectWithoutRef
    : T extends Array<infer U>
        ? Array<ResolvedType<U>>
        : T extends OpenAPIV3.SchemaObject
            ? SchemaObjectWithoutRef & {
            allOf?: ResolvedType<OpenAPIV3.SchemaObject>[];
            oneOf?: ResolvedType<OpenAPIV3.SchemaObject>[];
            anyOf?: ResolvedType<OpenAPIV3.SchemaObject>[];
        }
            : T;

function resolveReference<T>(
    obj: T,
    rootDocument: OpenAPIV3.Document,
    visited: Set<string> = new Set()
): ResolvedType<T> {
    if (!isReferenceObject(obj)) {
        return obj as ResolvedType<T>;
    }

    if (visited.has(obj.$ref)) {
        throw new Error(`Circular reference detected: ${obj.$ref}`);
    }

    visited.add(obj.$ref);
    const refPath = obj.$ref.split('/').slice(1);
    let current: unknown = rootDocument;

    try {
        for (const pathPart of refPath) {
            if (current && typeof current === 'object' && pathPart in current) {
                current = (current as Record<string, unknown>)[pathPart];
            } else {
                throw new Error(`Invalid reference path: ${obj.$ref}`);
            }
        }
    } catch (error) {
        throw new Error(`Can't resolve reference: ${obj.$ref}`);
    }

    if (current === undefined) {
        throw new Error(`Reference not found: ${obj.$ref}`);
    }

    return resolveReference(current as T, rootDocument, visited);
}

function resolveReferences<T>(
    obj: T,
    rootDocument: OpenAPIV3.Document
): ResolvedType<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj as ResolvedType<T>;
    }

    if (isReferenceObject(obj)) {
        return resolveReference(obj, rootDocument);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => resolveReferences(item, rootDocument)) as ResolvedType<T>;
    }

    const schemaObj = obj as OpenAPIV3.SchemaObject;
    const resolvedObj = { ...schemaObj } as ResolvedType<T>;

    if ('allOf' in obj && Array.isArray(obj.allOf)) {
        const resolvedAllOf = obj.allOf.map(schema =>
            resolveReferences(schema, rootDocument)
        );

        // Si tous les schémas sont résolus (pas de références), on les fusionne
        if (resolvedAllOf.every(schema => !isReferenceObject(schema))) {
            const mergedSchema = mergeAllOfSchemas(resolvedAllOf);
            return mergedSchema as ResolvedType<T>;
        } else {
            // Sinon on garde allOf avec les schémas résolus
            (resolvedObj as OpenAPIV3.SchemaObject).allOf = resolvedAllOf;
        }
    }

    if ('oneOf' in obj && Array.isArray(obj.oneOf)) {
        (resolvedObj as OpenAPIV3.SchemaObject).oneOf = obj.oneOf.map(schema =>
            resolveReferences(schema, rootDocument)
        );
    }

    if ('anyOf' in obj && Array.isArray(obj.anyOf)) {
        (resolvedObj as OpenAPIV3.SchemaObject).anyOf = obj.anyOf.map(schema =>
            resolveReferences(schema, rootDocument)
        );
    }

    // Résoudre les propriétés restantes
    for (const [key, value] of Object.entries(obj)) {
        if (!['allOf', 'oneOf', 'anyOf'].includes(key)) {
            (resolvedObj as Record<string, unknown>)[key] = resolveReferences(value, rootDocument);
        }
    }

    return resolvedObj;
}

function mergeAllOfSchemas(schemas: OpenAPIV3.SchemaObject[]): OpenAPIV3.SchemaObject {
    const baseSchema: OpenAPIV3.SchemaObject = {
        type: 'object',
        properties: {},
        required: []
    };

    return schemas.reduce<OpenAPIV3.SchemaObject>((merged, current) => {
        const mergedSchema: OpenAPIV3.SchemaObject = {
            ...merged,
            properties: {
                ...(merged.properties || {}),
                ...(current.properties || {})
            },
            required: [...(merged.required || []), ...(current.required || [])]
        };

        if (current.type) {
            mergedSchema.type = current.type;
        }

        return mergedSchema;
    }, baseSchema);
}

export {
    groupEndpointsByTags,
    findOperationByOperationIdAndTag,
    getBadgeColor,
    resolveReference,
    resolveReferences,
    mergeAllOfSchemas,
    isReferenceObject,
    type ReferenceObject,
    type ResolvedType
};
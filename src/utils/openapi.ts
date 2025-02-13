import { OpenAPIV3 } from 'openapi-types';
import { EnhancedOperationObject, TaggedOperationsMap } from '@/types/openapi';

const validHttpMethods = new Set<OpenAPIV3.HttpMethods>(
    Object.values(OpenAPIV3.HttpMethods)
);

type Reference = {
    $ref: string;
};

const isReference = (obj: any): obj is Reference => {
    return obj && typeof obj === 'object' && '$ref' in obj;
};

/**
 * Fusionne récursivement deux objets en gérant les cas spéciaux OpenAPI
 */
const mergeObjects = (obj1: any, obj2: any): any => {
    if (!obj1 || typeof obj1 !== 'object') return obj2;
    if (!obj2 || typeof obj2 !== 'object') return obj1;

    const result: any = { ...obj1 };

    for (const [key, value2] of Object.entries(obj2)) {
        if (key === 'required' && Array.isArray(value2) && Array.isArray(result[key])) {
            // Fusion des tableaux required en évitant les doublons
            result[key] = Array.from(new Set([...result[key], ...value2]));
        } else if (key === 'properties' && typeof value2 === 'object' && typeof result[key] === 'object') {
            // Fusion récursive des properties
            result[key] = mergeObjects(result[key], value2);
        } else if (key === 'items' && typeof value2 === 'object') {
            // Fusion spéciale pour les items de tableaux
            result[key] = result[key] && Object.keys(result[key]).length > 0
                ? mergeObjects(result[key], value2)
                : value2;
        } else if (Array.isArray(value2)) {
            // Fusion des tableaux normaux
            result[key] = Array.isArray(result[key])
                ? [...result[key], ...value2]
                : value2;
        } else if (typeof value2 === 'object') {
            // Fusion récursive des objets
            result[key] = result.hasOwnProperty(key)
                ? mergeObjects(result[key], value2)
                : value2;
        } else {
            // Remplacement simple pour les valeurs primitives
            result[key] = value2;
        }
    }

    return result;
};

/**
 * Résout une référence dans un document OpenAPI
 */
const resolveReference = (ref: string, document: OpenAPIV3.Document): any => {
    const parts = ref.split('/').slice(1);
    let current: any = document;

    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            throw new Error(`Invalid reference: ${ref}`);
        }
    }

    return current;
};

/**
 * Résout un schéma allOf en fusionnant tous ses sous-schémas
 */
const resolveAllOf = (schema: any, document: OpenAPIV3.Document, visited: Set<string>): any => {
    if (!schema.allOf || !Array.isArray(schema.allOf)) {
        return schema;
    }

    const resolvedSchemas = schema.allOf.map(subSchema =>
        resolveReferences(subSchema, document, visited)
    );

    // Fusion de tous les sous-schémas
    const mergedSchema = resolvedSchemas.reduce((acc, current) =>
            mergeObjects(acc, current),
        {}
    );

    // Supprime la propriété allOf et fusionne le reste du schéma
    const { allOf, ...restSchema } = schema;
    return mergeObjects(mergedSchema, restSchema);
};

const resolveReferences = (obj: any, document: OpenAPIV3.Document, visited = new Set<string>()): any => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    // Si c'est une référence
    if (isReference(obj)) {
        if (visited.has(obj.$ref)) {
            throw new Error(`Circular reference detected: ${obj.$ref}`);
        }
        visited.add(obj.$ref);
        const resolved = resolveReference(obj.$ref, document);
        return resolveReferences(resolved, document, visited);
    }

    // Si c'est un schéma avec allOf
    if (obj.allOf) {
        return resolveAllOf(obj, document, visited);
    }

    // Si c'est un tableau
    if (Array.isArray(obj)) {
        return obj.map(item => resolveReferences(item, document, new Set(visited)));
    }

    // Si c'est un objet
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = resolveReferences(value, document, new Set(visited));
    }

    return result;
};

const resolveOpenAPIDocument = (document: OpenAPIV3.Document): OpenAPIV3.Document => {
    const documentCopy = JSON.parse(JSON.stringify(document));

    // Résout les références dans paths
    if (documentCopy.paths) {
        documentCopy.paths = resolveReferences(documentCopy.paths, document);
    }

    // Résout les références dans components
    if (documentCopy.components) {
        documentCopy.components = resolveReferences(documentCopy.components, document);
    }

    return documentCopy;
};

function isValidHttpMethod(method: string): method is OpenAPIV3.HttpMethods {
    return validHttpMethods.has(method.toLowerCase() as OpenAPIV3.HttpMethods);
}

function groupEndpointsByTags(paths: OpenAPIV3.PathsObject): TaggedOperationsMap {
    const tagMap: TaggedOperationsMap = {};

    function pushToTag(
        tag: string | undefined,
        operation: OpenAPIV3.OperationObject,
        path: string,
        method: string
    ): void {
        const normalizedTag = tag || 'default';
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
                    const tag = typedOperation.tags?.[0] || 'default';
                    pushToTag(tag, typedOperation, path, method);
                }
            });
        }
    });

    return tagMap;
}

function findOperationByOperationIdAndTag(
    spec: OpenAPIV3.Document,
    operationId: string,
    tag?: string
): EnhancedOperationObject | null {
    if (!spec?.paths) return null;

    const groupedEndpoints = groupEndpointsByTags(spec.paths);
    const tagEndpoints = groupedEndpoints[tag || 'default'];

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

export {
    resolveOpenAPIDocument,
    groupEndpointsByTags,
    findOperationByOperationIdAndTag,
    getBadgeColor,
    isValidHttpMethod
};
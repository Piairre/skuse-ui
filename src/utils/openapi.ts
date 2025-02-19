import {
    UnifiedOpenAPI,
    SchemaObject,
    OperationObject,
    PathsObject,
    EnhancedOperationObject,
    TaggedOperationsMap,
    HttpMethod, OpenAPIInputDocument
} from '@/types/openapi';
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";

type Reference = {
    $ref: string;
};

const validHttpMethods = new Set<HttpMethod>([
    'GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'
]);

const isNullableSchema = (schema: SchemaObject): boolean => {
    if (schema.type === 'array') {
        return false;
    }

    return !schema.type &&
        !schema.properties &&
        !schema.oneOf &&
        !schema.anyOf;
};

const renderSchemaType = (schema: SchemaObject): string => {
    if (Array.isArray(schema.type)) {
        return schema.type.join(' | ');
    }

    if (schema.oneOf) {
        return 'oneOf';
    }

    if (schema.anyOf) {
        const types = schema.anyOf.map((subSchema: SchemaObject) => {
            if (isNullableSchema(subSchema)) return 'null';
            if (subSchema.type === 'object' && subSchema.properties) {
                return 'object';
            }
            return subSchema.type || 'unknown';
        });
        return `anyOf<${types.join(' | ')}>`;
    }

    if (schema.type === 'array' && schema.items) {
        if (!schema.items) return `${schema.type}[]`;
        const itemSchema = schema.items;
        if (Array.isArray(itemSchema.type)) {
            return `array<${itemSchema.type.join(' | ')}>`;
        }
        return `${schema.type}[${itemSchema.title || itemSchema.type || ''}]`;
    }

    return schema.type || schema.refName || 'object';
};

const generateExample = (schema: SchemaObject | undefined): any => {
    if (!schema) return null;

    if (schema.example !== undefined) return schema.example;

    if (schema.type === 'array') {
        if (!schema.items) return [];

        return [
            generateExample(schema.items as SchemaObject)
        ];
    }

    if (schema.ref && schema.refName && schema.properties) {
        return generateObjectExample(schema.properties);
    }

    if (schema.anyOf) {
        const nonNullSchema = schema.anyOf.find(subSchema => !isNullableSchema(subSchema));
        if (nonNullSchema) {
            return generateExample(nonNullSchema);
        }
        return null;
    }

    if (schema.oneOf) {
        return generateExample(schema.oneOf[0]);
    }

    if (schema.type === 'object' || schema.properties) {
        return generateObjectExample(schema.properties || {});
    }

    if (Array.isArray(schema.type)) {
        const nonNullType = schema.type.find(type => type !== 'null');
        return generateExample({ ...schema, type: nonNullType || schema.type[0] });
    }

    return generateBasicTypeExample(schema);
};

const generateObjectExample = (properties: Record<string, SchemaObject>): Record<string, any> => {
    return Object.fromEntries(
        Object.entries(properties).map(([key, prop]) => [
            key,
            generateExample(prop)
        ])
    );
};

const generateBasicTypeExample = (schema: SchemaObject): any => {
    const defaultValues: Record<string, () => any> = {
        string: () => {
            if (schema.enum?.length) return schema.enum[0];
            if (schema.format === 'date-time') return '2024-02-19T14:30:00Z';
            if (schema.format === 'date') return '2024-02-19';
            if (schema.format === 'email') return 'user@example.com';
            if (schema.format === 'uri') return 'https://example.com';
            if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
            if (schema.pattern) return `pattern:${schema.pattern}`;
            if (schema.minLength) return 'a'.repeat(schema.minLength);
        },
        number: () => {
            if (schema.minimum !== undefined) return schema.minimum;
            if (schema.maximum !== undefined) return schema.maximum;
            return 0;
        },
        integer: () => {
            if (schema.minimum !== undefined) return Math.ceil(schema.minimum);
            if (schema.maximum !== undefined) return Math.floor(schema.maximum);
            return 0;
        },
        boolean: () => schema.default ?? true,
        object: () => ({})
    };

    const type = schema.type as keyof typeof defaultValues;
    return defaultValues[type]?.() ?? schema.ref ?? null;
};

const isReference = (obj: any): obj is Reference => {
    return obj && typeof obj === 'object' && '$ref' in obj;
};

const mergeObjects = (obj1: any, obj2: any): any => {
    if (!obj1 || typeof obj1 !== 'object') return obj2;
    if (!obj2 || typeof obj2 !== 'object') return obj1;

    const result: any = { ...obj1 };

    for (const [key, value2] of Object.entries(obj2)) {
        if (key === 'required' && Array.isArray(value2) && Array.isArray(result[key])) {
            result[key] = Array.from(new Set([...result[key], ...value2]));
        } else if (key === 'properties' && typeof value2 === 'object' && typeof result[key] === 'object') {
            result[key] = mergeObjects(result[key], value2);
        } else if (key === 'items' && typeof value2 === 'object') {
            result[key] = result[key] && Object.keys(result[key]).length > 0
                ? mergeObjects(result[key], value2)
                : value2;
        } else if (Array.isArray(value2)) {
            result[key] = Array.isArray(result[key])
                ? [...result[key], ...value2]
                : value2;
        } else if (typeof value2 === 'object') {
            result[key] = result.hasOwnProperty(key)
                ? mergeObjects(result[key], value2)
                : value2;
        } else {
            result[key] = value2;
        }
    }

    return result;
};

const resolveReference = (ref: string, document: OpenAPIInputDocument): any => {
    const parts = ref.split('/').slice(1);
    let current: any = document;

    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = current[part];
        } else {
            throw new Error(`Invalid reference: ${ref}`);
        }
    }

    // add the reference property to the resolved reference
    current.ref = ref;
    current.refName = parts[parts.length - 1];

    return current;
};

const resolveAllOf = (schema: any, document: OpenAPIInputDocument, visited: Set<string>): any => {
    if (!schema.allOf || !Array.isArray(schema.allOf)) {
        return schema;
    }

    const resolvedSchemas = schema.allOf.map(subSchema =>
        resolveReferences(subSchema, document, visited)
    );

    const mergedSchema = resolvedSchemas.reduce((acc, current) =>
            mergeObjects(acc, current),
        {}
    );

    const { allOf, ...restSchema } = schema;
    return mergeObjects(mergedSchema, restSchema);
};

const resolveReferences = (obj: any, document: OpenAPIInputDocument, visited = new Set<string>()): any => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (isReference(obj)) {
        if (!visited.has(obj.$ref)) {
            visited.add(obj.$ref);
            const resolved = resolveReference(obj.$ref, document);
            return resolveReferences(resolved, document, visited);
        }
    }

    if (obj.allOf) {
        return resolveAllOf(obj, document, visited);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => resolveReferences(item, document, new Set(visited)));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        result[key] = resolveReferences(value, document, new Set(visited));
    }

    return result;
};

const resolveOpenAPIDocument = (document: OpenAPIInputDocument): UnifiedOpenAPI => {
    const documentCopy = JSON.parse(JSON.stringify(document));

    if (documentCopy.paths) {
        documentCopy.paths = resolveReferences(documentCopy.paths, document);
    }

    if (documentCopy.components) {
        documentCopy.components = resolveReferences(documentCopy.components, document);
    }

    return documentCopy as UnifiedOpenAPI;
};

function isValidHttpMethod(method: string): method is HttpMethod {
    return validHttpMethods.has(method.toUpperCase() as HttpMethod);
}

function groupEndpointsByTags(paths: PathsObject): TaggedOperationsMap {
    const tagMap: TaggedOperationsMap = {};

    function pushToTag(
        tag: string | undefined,
        operation: OperationObject,
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
            method: method.toUpperCase() as HttpMethod
        };

        tagMap[normalizedTag].push(enhancedOperation);
    }

    Object.entries(paths).forEach(([path, pathItem]) => {
        if (pathItem) {
            Object.entries(pathItem).forEach(([method, operation]) => {
                if (isValidHttpMethod(method)) {
                    const typedOperation = operation as OperationObject;

                    const tags = typedOperation.tags || ['default'];
                    tags.map(tag => pushToTag(tag, typedOperation, path, method));
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
    const { spec } = useOpenAPIContext();

    if (!spec?.paths) return null;

    const groupedEndpoints = groupEndpointsByTags(spec.paths);
    const tagEndpoints = groupedEndpoints[tag || 'default'];

    if (!tagEndpoints) return null;
    return tagEndpoints.find(endpoint => getOperationId(endpoint) === operationId) || null;
}

function getOperationId(operation: EnhancedOperationObject) {
    // Fallback if no operationId is provided
    if (!operation.operationId) {
        let formattedPath = operation.path.replace(/\//g, '_');
        return `${operation.method.toLowerCase()}${formattedPath}`;
    }

    return operation.operationId;
}

function getBadgeColor(httpMethod: string): string {
    const httpMethodColors: Record<HttpMethod, string> = {
        GET: 'bg-green-500',
        POST: 'bg-blue-500',
        PUT: 'bg-yellow-500',
        PATCH: 'bg-teal-500',
        DELETE: 'bg-red-500',
        OPTIONS: 'bg-purple-500',
        HEAD: 'bg-gray-500',
        TRACE: 'bg-pink-500'
    };

    return httpMethodColors[httpMethod.toUpperCase() as HttpMethod] || 'bg-gray-500';
}

export {
    resolveOpenAPIDocument,
    groupEndpointsByTags,
    findOperationByOperationIdAndTag,
    getBadgeColor,
    isValidHttpMethod,
    isNullableSchema,
    renderSchemaType,
    generateExample,
    getOperationId
};
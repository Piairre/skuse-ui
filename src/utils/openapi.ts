import {
    SchemaObject,
    OperationObject,
    PathsObject,
    EnhancedOperationObject,
    TaggedOperationsMap,
    HttpMethod,
    OpenAPIInputDocument,
    UnifiedOpenAPI,
} from '@/types/openapi';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type Reference = { $ref: string };
const isReference = (obj: unknown): obj is Reference =>
    !!obj && typeof obj === 'object' && '$ref' in obj;

const mergeObjects = (obj1: unknown, obj2: unknown): unknown => {
    if (!obj1 || typeof obj1 !== 'object') return obj2;
    if (!obj2 || typeof obj2 !== 'object') return obj1;
    const result: Record<string, unknown> = { ...(obj1 as Record<string, unknown>) };
    for (const [key, value2] of Object.entries(obj2 as Record<string, unknown>)) {
        const v1 = result[key];
        if (key === 'required' && Array.isArray(value2) && Array.isArray(v1)) {
            result[key] = Array.from(new Set([...v1, ...value2]));
        } else if (key === 'properties' && typeof value2 === 'object' && typeof v1 === 'object') {
            result[key] = mergeObjects(v1, value2);
        } else if (key === 'items' && typeof value2 === 'object') {
            result[key] = v1 && Object.keys(v1 as object).length > 0 ? mergeObjects(v1, value2) : value2;
        } else if (Array.isArray(value2)) {
            result[key] = Array.isArray(v1) ? [...v1, ...value2] : value2;
        } else if (typeof value2 === 'object') {
            result[key] = key in result ? mergeObjects(v1, value2) : value2;
        } else {
            result[key] = value2;
        }
    }
    return result;
};

const resolveReference = (ref: string, document: OpenAPIInputDocument): unknown => {
    const parts = ref.split('/').slice(1);
    let current: unknown = document;
    for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
            current = (current as Record<string, unknown>)[part];
        } else {
            throw new Error(`Invalid reference: ${ref}`);
        }
    }
    const resolved: Record<string, unknown> = typeof current === 'object' ? { ...(current as object) } : {};
    resolved['ref'] = ref;
    resolved['refName'] = parts[parts.length - 1];
    if (!resolved['type']) {
        const props = resolved['properties'];
        if (props && typeof props === 'object' && Object.keys(props).length > 0) resolved['type'] = 'object';
        else if (resolved['items']) resolved['type'] = 'array';
        else { resolved['type'] = 'object'; resolved['properties'] = {}; }
    }
    return resolved;
};

const resolveAllOf = (schema: Record<string, unknown>, document: OpenAPIInputDocument, visited: Set<string>): unknown => {
    if (!schema['allOf'] || !Array.isArray(schema['allOf'])) return schema;
    const resolved = schema['allOf'].map((sub: unknown) => resolveReferences(sub, document, visited));
    const merged = resolved.reduce((acc: unknown, cur: unknown) => mergeObjects(acc, cur), {});
    const { allOf: _, ...rest } = schema; // eslint-disable-line @typescript-eslint/no-unused-vars
    return mergeObjects(merged, rest);
};

const resolveReferences = (obj: unknown, document: OpenAPIInputDocument, visited = new Set<string>()): unknown => {
    if (!obj || typeof obj !== 'object') return obj;
    if (isReference(obj)) {
        if (!visited.has(obj.$ref)) {
            visited.add(obj.$ref);
            return resolveReferences(resolveReference(obj.$ref, document), document, visited);
        }
    }
    if ('allOf' in obj) return resolveAllOf(obj as Record<string, unknown>, document, visited);
    if (Array.isArray(obj)) return obj.map(item => resolveReferences(item, document, new Set(visited)));
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        result[key] = resolveReferences(value, document, new Set(visited));
    }
    return result;
};

const resolveOpenAPIDocument = (document: OpenAPIInputDocument): UnifiedOpenAPI => {
    const copy = JSON.parse(JSON.stringify(document)) as Record<string, unknown>;
    if (copy['paths']) copy['paths'] = resolveReferences(copy['paths'], document);
    if (copy['components']) copy['components'] = resolveReferences(copy['components'], document);
    return copy as unknown as UnifiedOpenAPI;
};

const validHttpMethods = new Set<HttpMethod>([
    'GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH', 'TRACE'
]);

// Detects schemas representing `null` — handles both v3.0 ({} placeholder) and v3.1 ({type:'null'})
const inferTypeFromEnum = (enumValues: unknown[] | undefined): string | null => {
    const first = enumValues?.[0];
    if (first === undefined) return null;
    if (typeof first === 'string') return 'string';
    if (typeof first === 'number') return 'number';
    if (typeof first === 'boolean') return 'boolean';
    return null;
};

const isNullableSchema = (schema: SchemaObject): boolean => {
    if (schema.type === 'null') return true;
    if (schema.type === 'array') return false;
    return !schema.type && !schema.properties && !schema.oneOf && !schema.anyOf && !schema.allOf;
};

const resolveSchemaTypeName = (schema: SchemaObject): string => {
    if (Array.isArray(schema.type)) return schema.type.join(' | ');
    if (schema.type === 'object' || schema.properties) return schema.title ?? 'object';
    if (schema.type === 'array') {
        const items = schema.items;
        if (!items) return 'array';
        if (Array.isArray(items.type)) return `array<${items.type.join(' | ')}>`;
        const itemType = items.type ?? inferTypeFromEnum(items.enum) ?? undefined;
        return `array[${items.title ?? itemType ?? 'any'}]`;
    }
    if (!schema.type && schema.enum?.length) return inferTypeFromEnum(schema.enum) ?? 'unknown';
    return schema.type ?? schema.title ?? 'unknown';
};

const renderSchemaType = (schema: SchemaObject): string => {
    // v3.1: type can be an array of types
    if (Array.isArray(schema.type)) {
        return schema.type.join(' | ');
    }

    if (schema.oneOf) return 'oneOf';

    if (schema.anyOf) {
        const nullItems = schema.anyOf.filter(isNullableSchema);
        const realItems = schema.anyOf.filter(s => !isNullableSchema(s));

        // Common pattern: anyOf with exactly one real type + null → "type | null"
        const firstReal = realItems[0];
        if (nullItems.length > 0 && realItems.length === 1 && firstReal) {
            return `${resolveSchemaTypeName(firstReal)} | null`;
        }

        const types = schema.anyOf.map(s =>
            isNullableSchema(s) ? 'null' : resolveSchemaTypeName(s)
        );
        return `anyOf<${types.join(' | ')}>`;
    }

    if (schema.allOf) return 'object';

    if (schema.type === 'array') {
        if (!schema.items) return 'array';
        const itemSchema = schema.items;
        if (Array.isArray(itemSchema.type)) return `array<${itemSchema.type.join(' | ')}>`;
        return `array[${itemSchema.title ?? itemSchema.type ?? 'any'}]`;
    }

    if (schema.type === 'object' || (!schema.type && schema.properties)) {
        const name = schema.title ?? 'object';
        return schema.nullable ? `${name} | null` : name;
    }
    if (!schema.type && schema.items) return 'array';

    if (!schema.type && schema.enum?.length) {
        const inferred = inferTypeFromEnum(schema.enum);
        if (inferred) return schema.nullable ? `${inferred} | null` : inferred;
    }

    const base = schema.type ?? schema.title ?? 'unknown';
    return schema.nullable ? `${base} | null` : base;
};

const generateExample = (schema: SchemaObject | undefined): JsonValue => {
    if (!schema) return null;

    // Flatten allOf wrappers first so the rest of the logic sees a clean schema
    const s = flattenSchema(schema);

    if (s.example !== undefined) return s.example;

    if (s.type === 'array') {
        if (!s.items) return [];
        return [generateExample(s.items)];
    }

    if (s.anyOf) {
        const nonNull = s.anyOf.find(sub => !isNullableSchema(sub));
        return nonNull ? generateExample(nonNull) : null;
    }

    if (s.oneOf) {
        return generateExample(s.oneOf[0]);
    }

    if (s.type === 'object' || s.properties) {
        return generateObjectExample(s.properties || {});
    }

    if (Array.isArray(s.type)) {
        const nonNullType = s.type.find(t => t !== 'null');
        return generateExample({ ...s, type: nonNullType ?? s.type[0] });
    }

    return generateBasicTypeExample(s);
};

const generateObjectExample = (properties: Record<string, SchemaObject>): Record<string, JsonValue> => {
    return Object.fromEntries(
        Object.entries(properties).map(([key, prop]): [string, JsonValue] => [key, generateExample(prop)])
    );
};

const generateBasicTypeExample = (schema: SchemaObject): JsonValue => {
    if (schema.default !== undefined) return schema.default;

    const defaultValues: Record<string, () => JsonValue> = {
        string: () => {
            if (schema.enum?.length) return schema.enum[0] ?? null;
            if (schema.format === 'date-time') return '2024-02-19T14:30:00Z';
            if (schema.format === 'date') return '2024-02-19';
            if (schema.format === 'email') return 'user@example.com';
            if (schema.format === 'uri') return 'https://example.com';
            if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
            if (schema.pattern) return `pattern:${schema.pattern}`;
            if (schema.minLength) return 'a'.repeat(schema.minLength);
            return 'string';
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
    return defaultValues[type]?.() ?? null;
};

function isValidHttpMethod(method: string): method is HttpMethod {
    return validHttpMethods.has(method.toUpperCase() as HttpMethod);
}

function groupEndpointsByTags(paths: PathsObject): TaggedOperationsMap {
    const tagMap: TaggedOperationsMap = {};

    Object.entries(paths).forEach(([path, pathItem]) => {
        if (!pathItem) return;

        const pathParameters = pathItem.parameters || [];

        Object.entries(pathItem).forEach(([method, operation]) => {
            if (!isValidHttpMethod(method)) return;

            const typedOperation = operation as OperationObject;
            const tags = typedOperation.tags || ['default'];

            const mergedOperation = { ...typedOperation };
            if (pathParameters.length > 0) {
                // Merge path parameters with operation parameters (without duplicates)
                const opParams = mergedOperation.parameters || [];
                const opParamIds = new Set(opParams.map(p => `${p.name}:${p.in}`));

                mergedOperation.parameters = [
                    ...opParams,
                    ...pathParameters.filter(p => !opParamIds.has(`${p.name}:${p.in}`))
                ];
            }

            const enhancedOperation: EnhancedOperationObject = {
                ...mergedOperation,
                path,
                method: method.toUpperCase() as HttpMethod
            };

            tags.forEach(tag => {
                const tagName = tag || 'default';
                if (!tagMap[tagName]) tagMap[tagName] = [];
                tagMap[tagName].push(enhancedOperation);
            });
        });
    });

    return tagMap;
}

function findOperationByOperationIdAndTag(
    paths: PathsObject,
    operationId: string,
    tag: string
): EnhancedOperationObject | null {
    if (!paths) return null;

    const groupedEndpoints = groupEndpointsByTags(paths);
    const tagEndpoints = groupedEndpoints[tag];

    if (!tagEndpoints) return null;
    return tagEndpoints.find(endpoint => getOperationId(endpoint) === operationId) || null;
}

function getOperationId(operation: EnhancedOperationObject) {
    // Fallback if no operationId is provided
    if (!operation.operationId) {
        const formattedPath = operation.path.replace(/\//g, '_');
        return `${operation.method.toLowerCase()}${formattedPath}`;
    }

    return operation.operationId;
}

function getBadgeColor(httpMethod: string): string {
    const httpMethodColors: Record<HttpMethod, string> = {
        GET: 'bg-blue-500',
        POST: 'bg-green-500',
        PUT: 'bg-yellow-500',
        PATCH: 'bg-teal-500',
        DELETE: 'bg-red-500',
        OPTIONS: 'bg-purple-500',
        HEAD: 'bg-gray-500',
        TRACE: 'bg-pink-500'
    };

    return httpMethodColors[httpMethod.toUpperCase() as HttpMethod] || 'bg-gray-500';
}

const flattenSchema = (schema: SchemaObject): SchemaObject => {
    if (!schema.allOf || schema.allOf.length === 0) return schema;

    const merged: SchemaObject = {};
    let mergedProps: Record<string, SchemaObject> = {};
    const mergedRequired: string[] = [];

    // Merge allOf items (left to right, last wins per field)
    for (const item of schema.allOf) {
        if (item.properties) mergedProps = { ...mergedProps, ...item.properties };
        if (item.required) mergedRequired.push(...item.required);
        Object.assign(merged, item);
    }

    // Outer schema overrides allOf items (skip allOf/properties/required — handled separately)
    for (const [key, val] of Object.entries(schema)) {
        if (key !== 'allOf' && key !== 'properties' && key !== 'required' && val !== undefined) {
            (merged as Record<string, unknown>)[key] = val;
        }
    }

    // Outer properties override inner (same-key wins to outer)
    if (schema.properties) mergedProps = { ...mergedProps, ...schema.properties };
    if (Object.keys(mergedProps).length > 0) merged.properties = mergedProps;

    // Deduplicated required union
    if (schema.required) mergedRequired.push(...schema.required);
    if (mergedRequired.length > 0) {
        merged.required = mergedRequired.filter((v, i, a) => a.indexOf(v) === i);
    }

    // Remove allOf so recursive call exits early
    merged.allOf = undefined;

    return flattenSchema(merged);
};

const isEmptySchema = (schema: SchemaObject): boolean => {
    const s = flattenSchema(schema);
    return !s.type &&
        !s.properties &&
        !s.items &&
        !s.oneOf &&
        !s.anyOf &&
        !s.allOf &&
        !s.enum &&
        !s.title;
};

export {
    resolveOpenAPIDocument,
    groupEndpointsByTags,
    findOperationByOperationIdAndTag,
    getBadgeColor,
    isValidHttpMethod,
    isNullableSchema,
    renderSchemaType,
    generateExample,
    flattenSchema,
    isEmptySchema,
    getOperationId
};
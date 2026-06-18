import {OpenAPIV2, OpenAPIV3, OpenAPIV3_1} from 'openapi-types';

export type OpenAPIInputDocument = OpenAPIV2.Document | OpenAPIV3.Document | OpenAPIV3_1.Document | {
    openapi: string;
    [key: string]: any;
};

export type HttpMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH' | 'TRACE';

export type PathsObject = {
    [path: string]: PathItemObject;
};

export interface UnifiedOpenAPI {
    openapi?: string; // OpenAPI v3
    swagger?: string; // OpenAPI v2
    info: {
        title: string;
        description?: string;
        termsOfService?: string;
        contact?: {
            name?: string;
            url?: string;
            email?: string;
        };
        license?: {
            name: string;
            url?: string;
            identifier?: string; // OpenAPI 3.1
        };
        version: string;
        summary?: string; // OpenAPI 3.1
    };
    servers?: ServerObject[];
    paths: {
        [path: string]: {
            summary?: string;
            description?: string;
            get?: OperationObject;
            put?: OperationObject;
            post?: OperationObject;
            delete?: OperationObject;
            options?: OperationObject;
            head?: OperationObject;
            patch?: OperationObject;
            trace?: OperationObject;
            servers?: ServerObject[];
            parameters?: ParameterObject[];
        };
    };
    components?: {
        schemas?: {
            [key: string]: SchemaObject;
        };
        responses?: {
            [key: string]: ResponseObject;
        };
        parameters?: {
            [key: string]: ParameterObject;
        };
        examples?: {
            [key: string]: ExampleObject;
        };
        requestBodies?: {
            [key: string]: RequestBodyObject;
        };
        headers?: {
            [key: string]: HeaderObject;
        };
        securitySchemes?: {
            [key: string]: SecuritySchemeObject;
        };
        links?: {
            [key: string]: LinkObject;
        };
        callbacks?: {
            [key: string]: CallbackObject;
        };
        pathItems?: {
            [key: string]: PathItemObject;
        };
    };
    security?: Array<{
        [key: string]: string[];
    }>;
    tags?: Array<{
        name: string;
        description?: string;
        externalDocs?: {
            description?: string;
            url: string;
        };
    }>;
    externalDocs?: {
        description?: string;
        url: string;
    };
}

export interface OperationObject {
    tags?: string[];
    summary?: string;
    description?: string;
    externalDocs?: {
        description?: string;
        url: string;
    };
    operationId?: string;
    parameters?: ParameterObject[];
    requestBody?: RequestBodyObject;
    responses: {
        [statusCode: string]: ResponseObject;
    };
    callbacks?: {
        [key: string]: CallbackObject;
    };
    deprecated?: boolean;
    security?: Array<{
        [key: string]: string[];
    }>;
    servers?: ServerObject[];
}

export interface ParameterObject {
    name: string;
    in: string;
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject;
    example?: any;
    examples?: {
        [key: string]: ExampleObject;
    };
    content?: {
        [key: string]: MediaTypeObject;
    };
}

export interface SchemaObject {
    type?: string | string[];
    ref?: string;
    refName?: string;
    items?: SchemaObject;
    properties?: {
        [key: string]: SchemaObject;
    };
    additionalProperties?: boolean | SchemaObject;
    description?: string;
    format?: string;
    default?: any;
    title?: string;
    multipleOf?: number;
    maximum?: number;
    exclusiveMaximum?: boolean | number;
    minimum?: number;
    exclusiveMinimum?: boolean | number;
    maxLength?: number;
    minLength?: number;
    pattern?: string;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    enum?: any[];
    allOf?: SchemaObject[];
    oneOf?: SchemaObject[];
    anyOf?: SchemaObject[];
    not?: SchemaObject;
    nullable?: boolean;
    discriminator?: {
        propertyName: string;
        mapping?: {
            [key: string]: string;
        };
    };
    readOnly?: boolean;
    writeOnly?: boolean;
    xml?: {
        name?: string;
        namespace?: string;
        prefix?: string;
        attribute?: boolean;
        wrapped?: boolean;
    };
    externalDocs?: {
        description?: string;
        url: string;
    };
    example?: any;
    examples?: any[]; // OpenAPI 3.1
    deprecated?: boolean;
    const?: any; // OpenAPI 3.1
    contentMediaType?: string; // OpenAPI 3.1
    $schema?: string; // OpenAPI 3.1
}

export interface ResponseObject {
    description: string;
    headers?: {
        [header: string]: HeaderObject;
    };
    content?: {
        [mediaType: string]: MediaTypeObject;
    };
    links?: {
        [key: string]: LinkObject;
    };
}

export interface RequestBodyObject {
    description?: string;
    content: {
        [mediaType: string]: MediaTypeObject;
    };
    required?: boolean;
}

export interface MediaTypeObject {
    schema?: SchemaObject;
    example?: any;
    examples?: {
        [key: string]: ExampleObject;
    };
    encoding?: {
        [key: string]: EncodingObject;
    };
}

export interface HeaderObject {
    description?: string;
    type?: string;
    required?: boolean;
    deprecated?: boolean;
    allowEmptyValue?: boolean;
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
    schema?: SchemaObject;
    example?: any;
    examples?: {
        [key: string]: ExampleObject;
    };
    content?: {
        [key: string]: MediaTypeObject;
    };
}

export interface ExampleObject {
    summary?: string;
    description?: string;
    value?: any;
    externalValue?: string;
}

export interface LinkObject {
    operationRef?: string;
    operationId?: string;
    parameters?: {
        [key: string]: any;
    };
    requestBody?: any;
    description?: string;
    server?: {
        url: string;
        description?: string;
        variables?: {
            [key: string]: {
                enum?: string[];
                default: string;
                description?: string;
            };
        };
    };
}

export interface CallbackObject {
    [key: string]: PathItemObject;
}

export interface PathItemObject {
    summary?: string;
    description?: string;
    get?: OperationObject;
    put?: OperationObject;
    post?: OperationObject;
    delete?: OperationObject;
    options?: OperationObject;
    head?: OperationObject;
    patch?: OperationObject;
    trace?: OperationObject;
    servers?: ServerObject[];
    parameters?: ParameterObject[];
}

export interface EncodingObject {
    contentType?: string;
    headers?: {
        [key: string]: HeaderObject;
    };
    style?: string;
    explode?: boolean;
    allowReserved?: boolean;
}

export interface ServerObject {
    url: string;
    description?: string;
    variables?: {
        [key: string]: ServerVariableObject;
    };
}

export interface ServerVariableObject {
    enum?: string[];
    default: string;
    description?: string;
}

export type SecuritySchemeObject =
    | {
    type: 'http' | 'basic';
    description?: string;
    scheme: string;
    bearerFormat?: string;
}
    | {
    type: 'apiKey';
    description?: string;
    name: string;
    in: string;
}
    | {
    type: 'oauth2';
    description?: string;
    flows: {
        implicit?: {
            authorizationUrl: string;
            refreshUrl?: string;
            scopes: {
                [scope: string]: string;
            };
        };
        password?: {
            tokenUrl: string;
            refreshUrl?: string;
            scopes: {
                [scope: string]: string;
            };
        };
        clientCredentials?: {
            tokenUrl: string;
            refreshUrl?: string;
            scopes: {
                [scope: string]: string;
            };
        };
        authorizationCode?: {
            authorizationUrl: string;
            tokenUrl: string;
            refreshUrl?: string;
            scopes: {
                [scope: string]: string;
            };
        };
    };
}
    | {
    type: 'openIdConnect';
    description?: string;
    openIdConnectUrl: string;
};

export interface EnhancedOperationObject extends OperationObject {
    path: string;
    method: HttpMethod;
}

export type TaggedOperationsMap = Record<string, EnhancedOperationObject[]>;
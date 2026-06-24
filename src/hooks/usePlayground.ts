import { useState, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { ParameterObject, RequestBodyObject, SchemaObject } from '@/types/unified-openapi-types';
import { generateExample } from '@/utils/openapi';

export const isFormType = (ct: string) =>
    ct === 'multipart/form-data' || ct === 'application/x-www-form-urlencoded';

const getFormFields = (ct: string, requestBody?: RequestBodyObject): Record<string, string> => {
    if (!requestBody || !isFormType(ct)) return {};
    const schema = requestBody.content[ct]?.schema as SchemaObject | undefined;
    if (!schema?.properties) return {};
    return Object.fromEntries(
        Object.entries(schema.properties)
            .filter(([, prop]) => prop.format !== 'binary')
            .map(([key, prop]) => [
                key,
                prop.default !== undefined
                    ? String(prop.default)
                    : (Array.isArray(prop.enum) && prop.enum.length > 0 ? String(prop.enum[0]) : ''),
            ])
    );
};

export interface PlaygroundResult {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;
    url: string;
    method: string;
}

interface UsePlaygroundOptions {
    method: string;
    path: string;
    parameters: ParameterObject[];
    security: Record<string, string[]>[];
    requestBody?: RequestBodyObject;
}

const getDefaultParamValue = (p: ParameterObject): string => {
    const schema = p.schema as SchemaObject | undefined;
    if (schema?.default !== undefined) return String(schema.default);
    if (Array.isArray(schema?.enum) && schema.enum.length > 0) return String(schema.enum[0]);
    return '';
};

export function usePlayground({ method, path, parameters, security, requestBody }: UsePlaygroundOptions) {
    const { computedUrl, credentials, preferredContentType, setPreferredContentType } = useOpenAPIContext();

    const pathParams = parameters.filter(p => p.in === 'path');
    const queryParams = parameters.filter(p => p.in === 'query');
    const headerParams = parameters.filter(p => p.in === 'header');

    const [pathValues, setPathValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(pathParams.map(p => [p.name, getDefaultParamValue(p)]))
    );

    const [queryValues, setQueryValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(queryParams.map(p => [p.name, getDefaultParamValue(p)]))
    );

    const [headerValues, setHeaderValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(headerParams.map(p => [p.name, getDefaultParamValue(p)]))
    );

    const contentTypes = requestBody ? Object.keys(requestBody.content) : [];
    const resolvedInitialCt = (preferredContentType && contentTypes.includes(preferredContentType))
        ? preferredContentType
        : (contentTypes[0] ?? 'application/json');
    const [contentType, setContentType] = useState(resolvedInitialCt);

    const handleSetContentType = useCallback((ct: string) => {
        setContentType(ct);
        setPreferredContentType(ct);
    }, [setPreferredContentType]);

    useEffect(() => {
        if (preferredContentType && contentTypes.includes(preferredContentType)) {
            setContentType(preferredContentType);
        }
    }, [preferredContentType]); // eslint-disable-line react-hooks/exhaustive-deps

    const getDefaultBody = useCallback((ct: string): string => {
        if (!requestBody) return '';
        const mediaType = requestBody.content[ct];
        if (!mediaType) return '';
        if (mediaType.examples) {
            const first = Object.values(mediaType.examples)[0];
            if (first?.value !== undefined) return JSON.stringify(first.value, null, 2);
        }
        if (mediaType.example !== undefined) return JSON.stringify(mediaType.example, null, 2);
        const schema = mediaType.schema as SchemaObject | undefined;
        if (schema?.example !== undefined) return JSON.stringify(schema.example, null, 2);
        if (schema) return JSON.stringify(generateExample(schema), null, 2);
        return '';
    }, [requestBody]);

    const [body, setBody] = useState<string>(() => getDefaultBody(contentTypes[0] ?? ''));
    const [formFields, setFormFields] = useState<Record<string, string>>(() => getFormFields(contentType, requestBody));
    const [formFiles, setFormFiles] = useState<Record<string, File>>({});

    useEffect(() => {
        if (isFormType(contentType)) {
            setFormFields(getFormFields(contentType, requestBody));
            setFormFiles({});
        } else {
            setBody(getDefaultBody(contentType));
        }
    }, [contentType]); // eslint-disable-line react-hooks/exhaustive-deps

    const [enabledParams, setEnabledParams] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(parameters.map(p => [`${p.in}:${p.name}`, true]))
    );
    const setParamEnabled = useCallback((key: string, enabled: boolean) => {
        setEnabledParams(prev => ({ ...prev, [key]: enabled }));
    }, []);
    const isEnabled = (p: ParameterObject) => enabledParams[`${p.in}:${p.name}`] !== false;

    const [result, setResult] = useState<PlaygroundResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    useEffect(() => {
        const newCt = (preferredContentType && contentTypes.includes(preferredContentType))
            ? preferredContentType
            : (contentTypes[0] ?? 'application/json');
        setContentType(newCt);
        setPathValues(Object.fromEntries(parameters.filter(p => p.in === 'path').map(p => [p.name, getDefaultParamValue(p)])));
        setQueryValues(Object.fromEntries(parameters.filter(p => p.in === 'query').map(p => [p.name, getDefaultParamValue(p)])));
        setHeaderValues(Object.fromEntries(parameters.filter(p => p.in === 'header').map(p => [p.name, getDefaultParamValue(p)])));
        setEnabledParams(Object.fromEntries(parameters.map(p => [`${p.in}:${p.name}`, true])));
        setBody(getDefaultBody(newCt));
        setFormFields(getFormFields(newCt, requestBody));
        setFormFiles({});
        setResult(null);
        setError(null);
        setValidationErrors([]);
    }, [path, method]); // eslint-disable-line react-hooks/exhaustive-deps

    const previewUrl = useMemo(() => {
        let resolvedPath = path;
        for (const [key, val] of Object.entries(pathValues)) {
            const param = parameters.find(p => p.in === 'path' && p.name === key);
            if (param && !isEnabled(param)) continue;
            resolvedPath = resolvedPath.replace(`{${key}}`, val ? encodeURIComponent(val) : key);
        }
        const base = (computedUrl || window.location.origin).replace(/\/$/, '');
        try {
            const url = new URL(base + resolvedPath);
            for (const [key, val] of Object.entries(queryValues)) {
                const param = parameters.find(p => p.in === 'query' && p.name === key);
                if (param && !isEnabled(param)) continue;
                if (val !== '') url.searchParams.set(key, val);
            }
            return url.toString();
        } catch {
            return base + resolvedPath;
        }
    }, [path, pathValues, queryValues, computedUrl, enabledParams]); // eslint-disable-line react-hooks/exhaustive-deps

    const curlCommand = useMemo(() => {
        let resolvedPath = path;
        for (const [key, val] of Object.entries(pathValues)) {
            const param = parameters.find(p => p.in === 'path' && p.name === key);
            if (param && !isEnabled(param)) continue;
            resolvedPath = resolvedPath.replace(`{${key}}`, val ? encodeURIComponent(val) : key);
        }
        const base = (computedUrl || window.location.origin).replace(/\/$/, '');
        let url: URL;
        try { url = new URL(base + resolvedPath); } catch { return ''; }

        const authHeaders: Record<string, string> = {};
        const authQuery: Record<string, string> = {};
        for (const requirement of security) {
            for (const schemeName of Object.keys(requirement)) {
                const cred = credentials[schemeName];
                if (!cred) continue;
                if (cred.type === 'bearer') authHeaders['Authorization'] = `Bearer ${cred.token}`;
                else if (cred.type === 'basic') authHeaders['Authorization'] = `Basic ${btoa(`${cred.username}:${cred.password}`)}`;
                else if (cred.type === 'oauth2') authHeaders['Authorization'] = `${cred.tokenType} ${cred.accessToken}`;
                else if (cred.type === 'openIdConnect') authHeaders['Authorization'] = `Bearer ${cred.accessToken}`;
                else if (cred.type === 'apiKey' && cred.in === 'header') authHeaders[cred.name] = cred.key;
                else if (cred.type === 'apiKey' && cred.in === 'query') authQuery[cred.name] = cred.key;
            }
        }
        for (const [key, val] of Object.entries({ ...authQuery, ...queryValues })) {
            const param = parameters.find(p => p.in === 'query' && p.name === key);
            if (param && !isEnabled(param)) continue;
            if (val !== '') url.searchParams.set(key, val);
        }
        const headers: Record<string, string> = { ...authHeaders };
        for (const [key, val] of Object.entries(headerValues)) {
            const param = parameters.find(p => p.in === 'header' && p.name === key);
            if (param && !isEnabled(param)) continue;
            if (val !== '') headers[key] = val;
        }
        const hasBody = !!requestBody && method !== 'GET' && method !== 'HEAD';
        if (hasBody && contentType === 'application/x-www-form-urlencoded') headers['Content-Type'] = contentType;
        else if (hasBody && !isFormType(contentType) && body !== '') headers['Content-Type'] = contentType;

        const parts = [`curl -X ${method}`];
        for (const [k, v] of Object.entries(headers)) parts.push(`  -H "${k}: ${v}"`);
        if (hasBody) {
            if (contentType === 'multipart/form-data') {
                for (const [k, v] of Object.entries(formFields)) {
                    if (v !== '') parts.push(`  -F "${k}=${v}"`);
                }
                for (const [k, f] of Object.entries(formFiles)) {
                    parts.push(`  -F "${k}=@${f.name}"`);
                }
            } else if (contentType === 'application/x-www-form-urlencoded') {
                const encoded = Object.entries(formFields)
                    .filter(([, v]) => v !== '')
                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                    .join('&');
                if (encoded) parts.push(`  --data '${encoded}'`);
            } else if (body !== '') {
                parts.push(`  --data-raw '${body.replace(/'/g, "'\\''")}'`);
            }
        }
        parts.push(`  "${url.toString()}"`);
        return parts.join(' \\\n');
    }, [method, path, pathValues, queryValues, headerValues, body, contentType, computedUrl, security, credentials, requestBody, enabledParams, formFields, formFiles]); // eslint-disable-line react-hooks/exhaustive-deps

    const send = useCallback(async () => {
        const missing: string[] = [];
        for (const p of parameters) {
            if (!isEnabled(p)) continue;
            if (!p.required) continue;
            if (p.in === 'path' && !pathValues[p.name]?.trim()) missing.push(`path:${p.name}`);
            if (p.in === 'query' && !queryValues[p.name]?.trim()) missing.push(`query:${p.name}`);
            if (p.in === 'header' && !headerValues[p.name]?.trim()) missing.push(`header:${p.name}`);
        }
        if (isFormType(contentType) && requestBody) {
            const schema = requestBody.content[contentType]?.schema as SchemaObject | undefined;
            for (const field of (schema?.required ?? [])) {
                const prop = schema?.properties?.[field];
                const isFile = prop?.format === 'binary';
                if (isFile ? !formFiles[field] : !formFields[field]?.trim()) missing.push(`form:${field}`);
            }
        } else if (requestBody?.required && !body.trim()) {
            missing.push('__body__');
        }
        setValidationErrors(missing);
        if (missing.length > 0) {
            toast.error('Fill in required fields before sending.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const authHeaders: Record<string, string> = {};
            const authQuery: Record<string, string> = {};
            let needCookies = false;

            for (const requirement of security) {
                for (const schemeName of Object.keys(requirement)) {
                    const cred = credentials[schemeName];
                    if (!cred) continue;
                    if (cred.type === 'bearer') {
                        authHeaders['Authorization'] = `Bearer ${cred.token}`;
                    } else if (cred.type === 'basic') {
                        authHeaders['Authorization'] = `Basic ${btoa(`${cred.username}:${cred.password}`)}`;
                    } else if (cred.type === 'oauth2') {
                        authHeaders['Authorization'] = `${cred.tokenType} ${cred.accessToken}`;
                    } else if (cred.type === 'openIdConnect') {
                        authHeaders['Authorization'] = `Bearer ${cred.accessToken}`;
                    } else if (cred.type === 'apiKey') {
                        if (cred.in === 'header') authHeaders[cred.name] = cred.key;
                        else if (cred.in === 'query') authQuery[cred.name] = cred.key;
                        else if (cred.in === 'cookie') needCookies = true;
                    }
                }
            }

            let resolvedPath = path;
            for (const [key, val] of Object.entries(pathValues)) {
                const param = parameters.find(p => p.in === 'path' && p.name === key);
                if (param && !isEnabled(param)) continue;
                resolvedPath = resolvedPath.replace(`{${key}}`, val ? encodeURIComponent(val) : key);
            }

            const base = (computedUrl || window.location.origin).replace(/\/$/, '');
            const url = new URL(base + resolvedPath);

            for (const [key, val] of Object.entries({ ...authQuery, ...queryValues })) {
                const param = parameters.find(p => p.in === 'query' && p.name === key);
                if (param && !isEnabled(param)) continue;
                if (val !== '') url.searchParams.set(key, val);
            }

            const headers: Record<string, string> = { ...authHeaders };
            for (const [key, val] of Object.entries(headerValues)) {
                const param = parameters.find(p => p.in === 'header' && p.name === key);
                if (param && !isEnabled(param)) continue;
                if (val !== '') headers[key] = val;
            }

            let fetchBody: BodyInit | undefined;
            const hasBody = !!requestBody && method !== 'GET' && method !== 'HEAD';
            if (hasBody) {
                if (contentType === 'multipart/form-data') {
                    const fd = new FormData();
                    for (const [k, v] of Object.entries(formFields)) {
                        if (v !== '') fd.append(k, v);
                    }
                    for (const [k, f] of Object.entries(formFiles)) {
                        fd.append(k, f, f.name);
                    }
                    fetchBody = fd;
                } else if (contentType === 'application/x-www-form-urlencoded') {
                    const params = new URLSearchParams();
                    for (const [k, v] of Object.entries(formFields)) {
                        if (v !== '') params.set(k, v);
                    }
                    fetchBody = params;
                    headers['Content-Type'] = 'application/x-www-form-urlencoded';
                } else if (body !== '') {
                    headers['Content-Type'] = contentType;
                    fetchBody = body;
                }
            }

            const finalUrl = url.toString();
            const isSameOrigin = url.origin === window.location.origin;
            const isPrivate = ['localhost', '127.0.0.1', '::1'].includes(url.hostname) || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.') || url.hostname.endsWith('.local');
            const fetchUrl = (isSameOrigin || isPrivate) ? finalUrl : `https://proxy.scalar.com?scalar_url=${encodeURIComponent(finalUrl)}`;
            const start = performance.now();
            const response = await fetch(fetchUrl, {
                method,
                headers,
                body: fetchBody,
                credentials: needCookies ? 'include' : 'same-origin',
            });
            const duration = Math.round(performance.now() - start);

            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((val, key) => { responseHeaders[key] = val; });

            setResult({
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: await response.text(),
                duration,
                url: finalUrl,
                method,
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            const isCors = msg === 'Failed to fetch' || msg.includes('NetworkError');
            setError(isCors
                ? 'Network error — the API likely blocks browser requests from this origin (CORS). Check the browser console for details.'
                : msg
            );
        } finally {
            setLoading(false);
        }
    }, [method, path, pathValues, queryValues, headerValues, body, contentType, computedUrl, security, credentials, requestBody, enabledParams, formFields, formFiles]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        pathValues, setPathValues,
        queryValues, setQueryValues,
        headerValues, setHeaderValues,
        body, setBody,
        formFields, setFormFields,
        formFiles, setFormFiles,
        contentType, setContentType: handleSetContentType,
        contentTypes,
        enabledParams,
        setParamEnabled,
        previewUrl,
        curlCommand,
        result,
        loading,
        error,
        validationErrors,
        send,
    };
}

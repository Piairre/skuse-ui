import React, { useState, useEffect } from 'react';
import { HTTPSnippet } from 'httpsnippet-lite';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
import { AuthCredential, SecuritySchemeObject } from '@/types/unified-openapi-types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CodeExamplesProps {
    method: string;
    path: string;
    requestBody?: string;
    hasRequestBody?: boolean;
    contentTypes?: string[];
    security?: Array<Record<string, string[]>>;
    exampleQueryParams?: Record<string, string>;
    exampleHeaderParams?: Array<{ key: string; value: string }>;
}

type HeaderDef = { key: string; value: string };

const LANGUAGES = [
    { label: 'cURL',               target: 'shell',      client: 'curl',          syntax: 'bash' },
    { label: 'HTTPie',             target: 'shell',      client: 'httpie',        syntax: 'bash' },
    { label: 'Wget',               target: 'shell',      client: 'wget',          syntax: 'bash' },
    { label: 'JavaScript (fetch)', target: 'javascript', client: 'fetch',         syntax: 'javascript' },
    { label: 'JavaScript (XHR)',   target: 'javascript', client: 'xhr',           syntax: 'javascript' },
    { label: 'Node.js (fetch)',    target: 'node',       client: 'fetch',         syntax: 'javascript' },
    { label: 'Node.js (axios)',    target: 'node',       client: 'axios',         syntax: 'javascript' },
    { label: 'Python',             target: 'python',     client: 'requests',      syntax: 'python' },
    { label: 'PHP',                target: 'php',        client: 'curl',          syntax: 'php' },
    { label: 'Ruby',               target: 'ruby',       client: 'native',        syntax: 'ruby' },
    { label: 'Go',                 target: 'go',         client: 'native',        syntax: 'go' },
    { label: 'Java (OkHttp)',      target: 'java',       client: 'okhttp',        syntax: 'java' },
    { label: 'C#',                 target: 'csharp',     client: 'restsharp',     syntax: 'csharp' },
    { label: 'Swift',              target: 'swift',      client: 'nsurlsession',  syntax: 'swift' },
    { label: 'Kotlin',             target: 'kotlin',     client: 'okhttp',        syntax: 'kotlin' },
] as const;

type Lang = typeof LANGUAGES[number];

function resolveAuthHeaders(
    security: Array<Record<string, string[]>> | undefined,
    securitySchemes: Record<string, SecuritySchemeObject> | undefined,
    credentials: Record<string, AuthCredential>,
): { headers: HeaderDef[]; queryParams: Record<string, string> } {
    const empty = { headers: [] as HeaderDef[], queryParams: {} as Record<string, string> };
    if (!securitySchemes) return empty;

    const requirements: Array<Record<string, string[]>> = security?.length
        ? security
        : Object.keys(credentials).length
            ? Object.keys(credentials).map(name => ({ [name]: [] }))
            : [];

    for (const requirement of requirements) {
        const names = Object.keys(requirement);
        if (!names.every(n => credentials[n])) continue;

        const headers: HeaderDef[] = [];
        const queryParams: Record<string, string> = {};

        for (const name of names) {
            const cred = credentials[name];
            if (!cred) continue;
            if (cred.type === 'bearer') {
                headers.push({ key: 'Authorization', value: `Bearer ${cred.token}` });
            } else if (cred.type === 'basic') {
                headers.push({ key: 'Authorization', value: `Basic ${btoa(`${cred.username}:${cred.password}`)}` });
            } else if (cred.type === 'oauth2') {
                headers.push({ key: 'Authorization', value: `${cred.tokenType} ${cred.accessToken}` });
            } else if (cred.type === 'apiKey') {
                if (cred.in === 'header') headers.push({ key: cred.name, value: cred.key });
                else if (cred.in === 'query') queryParams[cred.name] = cred.key;
            }
        }

        if (headers.length || Object.keys(queryParams).length) return { headers, queryParams };
    }

    return empty;
}

const CodeExamples: React.FC<CodeExamplesProps> = ({
    method, path, requestBody, hasRequestBody, contentTypes,
    security, exampleQueryParams, exampleHeaderParams,
}) => {
    const { computedUrl, credentials, spec, preferredContentType } = useOpenAPIContext();
    const [selectedLang, setSelectedLang] = useState<Lang>(LANGUAGES[0]);
    const [snippet, setSnippet] = useState<string>('');

    useEffect(() => {
        if (!computedUrl) return;

        let cancelled = false;

        (async () => {
            try {
                const { headers: authHeaders, queryParams } = resolveAuthHeaders(
                    security,
                    spec.components?.securitySchemes,
                    credentials,
                );

                const mergedQuery = { ...exampleQueryParams, ...queryParams };
                const urlWithQuery = Object.keys(mergedQuery).length
                    ? `${computedUrl}${path}?${new URLSearchParams(mergedQuery)}`
                    : `${computedUrl}${path}`;

                const contentType = (preferredContentType && contentTypes?.includes(preferredContentType))
                    ? preferredContentType
                    : (contentTypes?.[0] ?? 'application/json');
                const allHeaders: HeaderDef[] = [
                    ...(exampleHeaderParams ?? []),
                    ...authHeaders,
                    ...(hasRequestBody ? [{ key: 'Content-Type', value: contentType }] : []),
                ];

                const harRequest = {
                    method: method.toUpperCase(),
                    url: urlWithQuery,
                    httpVersion: 'HTTP/1.1',
                    headers: allHeaders.map(h => ({ name: h.key, value: h.value })),
                    queryString: [] as { name: string; value: string }[],
                    cookies: [] as { name: string; value: string }[],
                    postData: hasRequestBody && requestBody
                        ? { mimeType: contentType, text: requestBody }
                        : undefined,
                    headersSize: 0,
                    bodySize: 0,
                };

                const httpsnippet = new HTTPSnippet(harRequest);
                const result = await httpsnippet.convert(selectedLang.target, selectedLang.client);
                if (!cancelled) {
                    const str = Array.isArray(result) ? (result[0] ?? '') : (result ?? '');
                    setSnippet(str);
                }
            } catch (e) {
                console.error('[CodeExamples] snippet error:', e);
                if (!cancelled) setSnippet('Could not generate snippet.');
            }
        })();

        return () => { cancelled = true; };
    }, [method, path, requestBody, hasRequestBody, selectedLang, computedUrl, credentials, security, spec, preferredContentType, exampleQueryParams, exampleHeaderParams, contentTypes]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Code Examples</h3>
                <Select
                    value={selectedLang.label}
                    onValueChange={v => {
                        const found = LANGUAGES.find(l => l.label === v);
                        if (found) setSelectedLang(found);
                    }}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LANGUAGES.map(lang => (
                            <SelectItem key={lang.label} value={lang.label}>
                                {lang.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg">
                <FormattedMarkdown
                    markdown={snippet}
                    languageCode={selectedLang.syntax}
                    maxLines={20}
                    className="[&_code]:!whitespace-pre-wrap"
                />
            </div>
        </div>
    );
};

export default CodeExamples;

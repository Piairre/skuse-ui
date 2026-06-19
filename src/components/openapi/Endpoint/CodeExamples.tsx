import React, { useState, useEffect } from 'react';
import { convert, getLanguageList } from 'postman-code-generators';
import * as postman from 'postman-collection';
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
    defaultContentType?: string;
    security?: Array<Record<string, string[]>>;
    exampleQueryParams?: Record<string, string>;
    exampleHeaderParams?: Array<{ key: string; value: string }>;
}

type HeaderDef = { key: string; value: string };

function resolveAuthHeaders(
    security: Array<Record<string, string[]>> | undefined,
    securitySchemes: Record<string, SecuritySchemeObject> | undefined,
    credentials: Record<string, AuthCredential>,
): { headers: HeaderDef[]; queryParams: Record<string, string> } {
    const empty = { headers: [] as HeaderDef[], queryParams: {} as Record<string, string> };
    if (!securitySchemes) return empty;

    // Candidates: endpoint security → global spec security → any set credential
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
            const scheme = securitySchemes[name];
            if (!cred || !scheme) continue;

            if (cred.type === 'bearer') {
                headers.push({ key: 'Authorization', value: `Bearer ${cred.token}` });
            } else if (cred.type === 'basic') {
                headers.push({ key: 'Authorization', value: `Basic ${btoa(`${cred.username}:${cred.password}`)}` });
            } else if (cred.type === 'oauth2') {
                headers.push({ key: 'Authorization', value: `${cred.tokenType} ${cred.accessToken}` });
            } else if (cred.type === 'apiKey') {
                if (cred.in === 'header') {
                    headers.push({ key: cred.name, value: cred.key });
                } else if (cred.in === 'query') {
                    queryParams[cred.name] = cred.key;
                }
                // cookie: not injectable in curl snippets
            }
        }

        if (headers.length || Object.keys(queryParams).length) return { headers, queryParams };
    }

    return empty;
}

interface LanguageVariant {
    key: string;
    label: string;
}

interface Language {
    key: string;
    label: string;
    syntax_mode: string;
    variants: LanguageVariant[];
}

interface FlattenedLanguage {
    language: Language;
    variant?: string;
}

interface PostmanRequestOptions {
    indentCount: number;
    indentType: 'Space' | 'Tab';
    trimRequestBody: boolean;
    followRedirect: boolean;
}

type ConvertCallback = (error: Error | null, snippet: string) => void;

const DEFAULT_REQUEST_OPTIONS: PostmanRequestOptions = {
    indentCount: 2,
    indentType: 'Space',
    trimRequestBody: true,
    followRedirect: true,
};

const getSelectKey = (lang: FlattenedLanguage) =>
    lang.variant ? `${lang.language.key}:${lang.variant}` : lang.language.key;

const findDefaultLanguage = (langs: FlattenedLanguage[]): FlattenedLanguage =>
    langs.find(l => l.language.key === 'curl') ?? langs[0] as FlattenedLanguage;

const CodeExamples: React.FC<CodeExamplesProps> = ({ method, path, requestBody, hasRequestBody, defaultContentType, security, exampleQueryParams, exampleHeaderParams }) => {
    const { computedUrl, credentials, spec, preferredContentType } = useOpenAPIContext();
    const [languages, setLanguages] = useState<FlattenedLanguage[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<FlattenedLanguage | null>(null);
    const [snippet, setSnippet] = useState<string>('');

    useEffect(() => {
        const langs: Language[] = getLanguageList();
        const flattenedLanguages: FlattenedLanguage[] = langs.flatMap(lang =>
            lang.variants.length > 0
                ? lang.variants.map(variant => ({ language: lang, variant: variant.key }))
                : [{ language: lang }]
        );
        setLanguages(flattenedLanguages);
        if (flattenedLanguages.length > 0) {
            setSelectedLanguage(findDefaultLanguage(flattenedLanguages));
        }
    }, []);

    useEffect(() => {
        if (!selectedLanguage || !computedUrl) return;

        try {
            const { headers: authHeaders, queryParams } = resolveAuthHeaders(
                security,
                spec.components?.securitySchemes,
                credentials,
            );

            const mergedQueryParams = { ...exampleQueryParams, ...queryParams };
            const urlWithQuery = Object.keys(mergedQueryParams).length
                ? `${computedUrl}${path}?${new URLSearchParams(mergedQueryParams)}`
                : `${computedUrl}${path}`;

            const contentType = preferredContentType ?? defaultContentType ?? 'application/json';
            const allHeaders: HeaderDef[] = [
                ...(exampleHeaderParams ?? []),
                ...authHeaders,
                ...(hasRequestBody ? [{ key: 'Content-Type', value: contentType }] : []),
            ];

            const request = new postman.Request({
                method: method.toUpperCase(),
                url: urlWithQuery,
                header: allHeaders,
                ...(requestBody && {
                    body: {
                        mode: 'raw' as const,
                        raw: requestBody,
                        options: { raw: { language: 'json' as const } }
                    }
                })
            });

            const handleConversion: ConvertCallback = (error, generatedSnippet) => {
                if (error) {
                    console.error('Snippet generation error:', error);
                    setSnippet('Could not generate snippet');
                    return;
                }
                setSnippet(generatedSnippet);
            };

            convert(
                selectedLanguage.language.key,
                selectedLanguage.variant || '',
                request,
                DEFAULT_REQUEST_OPTIONS,
                handleConversion
            );
        } catch (error) {
            console.error('Request creation error:', error);
            setSnippet('Could not generate snippet');
        }
    }, [method, path, requestBody, hasRequestBody, selectedLanguage, computedUrl, credentials, security, spec, preferredContentType, exampleQueryParams, exampleHeaderParams]);

    const handleSelectChange = (value: string) => {
        const found = languages.find(l => getSelectKey(l) === value);
        if (found) setSelectedLanguage(found);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Code Examples</h3>
                <Select
                    value={selectedLanguage ? getSelectKey(selectedLanguage) : undefined}
                    onValueChange={handleSelectChange}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                        {languages.map((lang) => (
                            <SelectItem key={getSelectKey(lang)} value={getSelectKey(lang)}>
                                {lang.language.label}{lang.variant ? ` (${lang.variant})` : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg">
                <FormattedMarkdown
                    markdown={snippet}
                    languageCode={selectedLanguage?.language.syntax_mode ?? ''}
                    className="[&_code]:!whitespace-pre-wrap"
                />
            </div>
        </div>
    );
};

export default CodeExamples;

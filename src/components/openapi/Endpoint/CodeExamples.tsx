import React, { useState, useEffect } from 'react';
import { convert, getLanguageList } from 'postman-code-generators';
import * as postman from 'postman-collection';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';
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

const CodeExamples: React.FC<CodeExamplesProps> = ({ method, path, requestBody }) => {
    const { computedUrl } = useOpenAPIContext();
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
            setSelectedLanguage(flattenedLanguages[0] as FlattenedLanguage);
        }
    }, []);

    useEffect(() => {
        if (!selectedLanguage || !computedUrl) return;

        try {
            const request = new postman.Request({
                method: method.toUpperCase(),
                url: `${computedUrl}${path}`,
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
    }, [method, path, requestBody, selectedLanguage, computedUrl]);

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

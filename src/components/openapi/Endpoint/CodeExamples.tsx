import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Braces } from 'lucide-react';
import { convert, getLanguageList } from 'postman-code-generators';
import * as postman from 'postman-collection';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem } from "@/components/ui/command";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import {useOpenAPIContext} from "@/hooks/OpenAPIContext";

interface CodeExamplesProps {
    method: string;
    path: string;
    requestBody?: string;
}

type Language = {
    key: string;
    label: string;
    syntax_mode: string;
    variants: { key: string; label: string }[];
};

type FlattenLanguage = { language: Language; variant?: string };

const CodeExamples: React.FC<CodeExamplesProps> = ({ method, path, requestBody}) => {
    const {computedUrl} = useOpenAPIContext();
    const [languages, setLanguages] = useState<FlattenLanguage[]>([]);
    const [selectedLanguage, setSelectedLanguage] = useState<{ language: Language; variant?: string } | null>(null);
    const [snippet, setSnippet] = useState<string>('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const langs: Language[] = getLanguageList();
        const flattenedLanguages = langs.flatMap(lang =>
            lang.variants.length > 0
                ? lang.variants.map(variant => ({ language: lang, variant: variant.key }))
                : [{ language: lang }]
        );
        setLanguages(flattenedLanguages);
        if (flattenedLanguages.length > 0) {
            setSelectedLanguage(flattenedLanguages[0] as FlattenLanguage);
        }
    }, []);

    useEffect(() => {
        if (!selectedLanguage) return;
        try {
            const request = new postman.Request({
                method: method.toUpperCase(),
                url: `${computedUrl}${path}`,
                ...(requestBody && {
                    body: { mode: 'raw', raw: requestBody, options: { raw: { language: 'json' } } }
                })
            });

            convert(
                selectedLanguage.language.key,
                selectedLanguage.variant || '',
                request,
                { indentCount: 2, indentType: 'Space', trimRequestBody: true, followRedirect: true },
                (error, generatedSnippet) => {
                    if (error) {
                        setSnippet('Could not generate snippet');
                        return;
                    }

                    // Generate snippet with triple backticks for markdown
                    setSnippet(`\`\`\`${selectedLanguage.language.syntax_mode}\n${generatedSnippet}\n\`\`\``);
                }
            );
        } catch (error) {
            setSnippet('Could not generate snippet');
        }
    }, [method, path, requestBody, selectedLanguage]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium mb-2">Code Examples</h3>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="flex items-center gap-2">
                            <Braces className="w-4 h-4" /> {selectedLanguage?.language.label}
                            {selectedLanguage?.variant ? ` (${selectedLanguage.variant})` : ""}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-2">
                        <Command>
                            <CommandInput placeholder="Search language..." />
                            <CommandList>
                                {languages.map(({ language, variant }) => (
                                    <CommandItem
                                        key={variant ? `${language.key}:${variant}` : language.key}
                                        onSelect={() => {
                                            setSelectedLanguage({ language, variant });
                                            setOpen(false);
                                        }}
                                    >
                                        {language.label} {variant ? `(${variant})` : ""}
                                    </CommandItem>
                                ))}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            <FormattedMarkdown
                markdown={snippet}
                className="[&_code]:!whitespace-pre-wrap"
            />
        </div>
    );
};

export default CodeExamples;

import React, { CSSProperties, useEffect, useState } from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeExternalLinks from 'rehype-external-links';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface MarkdownRendererProps {
    markdown: string;
    className?: string;
    style?: CSSProperties;
    maxLength?: number;
    languageCode?: string;
}

// Polyfill for setImmediate if not available
const setImmediate = (callback: () => void) => {
    return setTimeout(callback, 0);
};

export const useHashLinkFix = () => {
    useEffect(() => {
        const hashchange = () => {
            let hash: string | undefined;
            try {
                hash = decodeURIComponent(location.hash.slice(1)).toLowerCase();
            } catch {
                return;
            }

            const name = 'user-content-' + hash;
            const target =
                document.getElementById(name) ||
                document.getElementsByName(name)[0];

            if (target) {
                setImmediate(() => {
                    target.scrollIntoView({ behavior: 'smooth' });
                });
            }
        };

        // Initial hash check
        hashchange();

        // Listen for hash changes
        window.addEventListener('hashchange', hashchange);

        // Handle clicking on same hash link
        const handleClick = (event: MouseEvent) => {
            if (
                event.target &&
                event.target instanceof HTMLAnchorElement &&
                event.target.href === location.href &&
                location.hash.length > 1
            ) {
                setImmediate(() => {
                    if (!event.defaultPrevented) {
                        hashchange();
                    }
                });
            }
        };

        document.addEventListener('click', handleClick, false);

        // Cleanup listeners
        return () => {
            window.removeEventListener('hashchange', hashchange);
            document.removeEventListener('click', handleClick);
        };
    }, []);
};

export default function FormattedMarkdown({
                                              markdown,
                                              className,
                                              style,
                                              maxLength,
                                              languageCode
                                          }: MarkdownRendererProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    useHashLinkFix();

    if (languageCode === 'json') {
        // reformating json to be more readable
        markdown = JSON.stringify(JSON.parse(markdown), null, 2);
    }

    // Format the content based on languageCode if provided
    const formattedContent = languageCode
        ? "```" + languageCode + "\n" + markdown + "\n```"
        : markdown;

    // Determine if content should be truncated
    const shouldTruncate = maxLength && formattedContent.length > maxLength && !isExpanded;
    const displayContent = shouldTruncate
        ? formattedContent.slice(0, maxLength) + "..."
        : formattedContent;

    const handleExpand = async () => {
        setIsLoading(true);
        // Simulate a small delay to show the loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        setIsExpanded(true);
        setIsLoading(false);
    };

    return (
        <div className="relative">
            <div className={shouldTruncate ? "relative" : undefined}>
                <MarkdownPreview
                    source={displayContent}
                    rehypePlugins={[
                        [
                            rehypeSanitize, {
                            ...defaultSchema,
                            attributes: {
                                ...defaultSchema.attributes,
                                a: [...(defaultSchema.attributes?.a || []), 'class'],
                                svg: ['className', 'hidden', 'viewBox', 'fill', 'height', 'width', 'aria-hidden', 'version'],
                                path: ['fill-rule', 'd'],
                                div: ['className', 'class', 'data-code', ...(defaultSchema.attributes?.div || [])],
                            },
                            tagNames: [
                                ...(defaultSchema.tagNames || []), 'a', 'svg', 'path', 'div'
                            ],
                        },
                        ],
                        [
                            rehypeExternalLinks, {
                            target: '_blank',
                            rel: ['noopener', 'noreferrer']
                        }
                        ]
                    ]}
                    style={{ backgroundColor: 'transparent', ...style }}
                    className={className}
                />
                {shouldTruncate && (
                    <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white dark:from-black to-transparent" />
                )}
            </div>
            {shouldTruncate && (
                <div className="flex justify-center -mt-12 relative z-10">
                    <Button
                        variant="outline"
                        onClick={handleExpand}
                        disabled={isLoading}
                        className="rounded-full px-6 bg-white dark:bg-black shadow-md hover:shadow-lg transition-shadow"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'See more'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
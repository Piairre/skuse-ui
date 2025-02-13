import React, {CSSProperties, useEffect} from 'react';
import MarkdownPreview from '@uiw/react-markdown-preview';
import rehypeSanitize, {defaultSchema} from "rehype-sanitize";
import rehypeExternalLinks from 'rehype-external-links'

interface MarkdownRendererProps {
    markdown: string;
    className?: string;
    style?: CSSProperties;
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
                    target.scrollIntoView({behavior: 'smooth'});
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

export default function FormattedMarkdown({markdown, className, style}: MarkdownRendererProps) {

    useHashLinkFix();

    return (
        <div>
            <MarkdownPreview
                source={markdown}
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
                style={{backgroundColor: 'transparent', ...style}}
                className={className}
            />
        </div>
    );
}
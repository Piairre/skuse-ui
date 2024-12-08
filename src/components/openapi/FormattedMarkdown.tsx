import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
    content: string;
    maxHeight?: string;
}

export default function FormattedMarkdown({markdown, maxHeight = 'max-h-[400px]'}: MarkdownRendererProps) {
    return (
        <div className={`overflow-y-auto ${maxHeight}`}>
            <ReactMarkdown
                className={'prose prose-sm sm:prose-base dark:prose-invert'}
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({node, ...props}) => (
                        <a
                            {...props}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        />
                    ),
                    code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <SyntaxHighlighter
                                style={coldarkDark}
                                language={match[1]}
                                PreTag="div"
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        ) : (
                            <code
                                className={`${className} inline-code bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    table: ({node, ...props}) => (
                        <table
                            className="w-full border-collapse border border-gray-300 dark:border-gray-600"
                            {...props}
                        />
                    ),
                    th: ({node, ...props}) => (
                        <th
                            className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-100 dark:bg-gray-800"
                            {...props}
                        />
                    ),
                    td: ({node, ...props}) => (
                        <td
                            className="border border-gray-300 dark:border-gray-600 p-2"
                            {...props}
                        />
                    ),
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mt-4 mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mt-3 mb-2 border-b pb-1" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-semibold mt-2 mb-1" {...props} />,
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
}
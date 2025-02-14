import React from 'react';
import {ExternalLink} from 'lucide-react';

interface ExternalDocsLinkProps {
    url: string;
}

const ExternalDocsLink: React.FC<ExternalDocsLinkProps> = ({ url }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
    >
        <ExternalLink className="h-3 w-3" />
        Documentation
    </a>
);

export default ExternalDocsLink;
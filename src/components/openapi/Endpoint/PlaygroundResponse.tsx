import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, WifiOff, TriangleAlert, Send, Loader2 } from 'lucide-react';
import FormattedMarkdown from '@/components/openapi/FormattedMarkdown';
import { getBadgeColor } from '@/utils/openapi';
import { PlaygroundResult } from '@/hooks/usePlayground';
import { Button } from '@/components/ui/button';

const STATUS_BG: Record<string, string> = {
    '1': 'bg-blue-500',
    '2': 'bg-green-500',
    '3': 'bg-yellow-500',
    '4': 'bg-orange-500',
    '5': 'bg-red-500',
};

const resolveBody = (result: PlaygroundResult): { body: string; lang: string } => {
    const ct = result.headers['content-type'] ?? '';
    if (ct.includes('json') && result.body) {
        try {
            return { body: JSON.stringify(JSON.parse(result.body), null, 2), lang: 'json' };
        } catch { /* not valid JSON, fall through */ }
    }
    if (ct.includes('xml')) return { body: result.body, lang: 'xml' };
    if (ct.includes('html')) return { body: result.body, lang: 'html' };
    return { body: result.body, lang: 'text' };
};

interface PlaygroundResponseProps {
    result: PlaygroundResult | null;
    loading: boolean;
    error: string | null;
    previewUrl: string;
    method: string;
    expectedStatusCodes: string[];
    onSend: () => void;
}

const PlaygroundResponse: React.FC<PlaygroundResponseProps> = ({ result, loading, error, previewUrl, method, expectedStatusCodes, onSend }) => {
    const [headersOpen, setHeadersOpen] = useState(false);
    const resolved = useMemo(() => result ? resolveBody(result) : null, [result]);

    const urlRow = (url: string, m: string) => (
        <div className="flex items-center gap-2 min-w-0 rounded-md bg-muted/60 px-2.5 py-1.5">
            <Badge className={`${getBadgeColor(m.toLowerCase())} text-white font-mono text-[10px] px-2 py-0.5 shrink-0`}>
                {m}
            </Badge>
            <span className="text-xs font-mono text-muted-foreground truncate">{url}</span>
        </div>
    );

    const sendButton = (
        <Button onClick={onSend} disabled={loading} className="w-full gap-2 rounded-xl">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {loading ? 'Sending…' : 'Send'}
        </Button>
    );

    if (loading) {
        return (
            <div className="space-y-3">
                {urlRow(previewUrl, method)}
                {sendButton}
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-3">
                {urlRow(previewUrl, method)}
                {sendButton}
                <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                    <WifiOff className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    if (!result || !resolved) {
        return (
            <div className="space-y-3">
                {urlRow(previewUrl, method)}
                {sendButton}
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground italic">
                    Send a request to see the response.
                </div>
            </div>
        );
    }

    const statusBg = STATUS_BG[String(result.status).charAt(0)] ?? 'bg-gray-500';
    const isUnexpected = expectedStatusCodes.length > 0 && !expectedStatusCodes.includes(String(result.status));
    const bodyBytes = result.body ? new TextEncoder().encode(result.body).length : 0;
    const bodySize = bodyBytes < 1024 ? `${bodyBytes} B` : bodyBytes < 1024 * 1024 ? `${(bodyBytes / 1024).toFixed(1)} KB` : `${(bodyBytes / (1024 * 1024)).toFixed(1)} MB`;

    return (
        <div className="space-y-3">
            {urlRow(previewUrl, method)}
            {sendButton}
            <p className="text-[10px] text-muted-foreground font-mono truncate">
                Sent: {result.url}
            </p>
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${statusBg} text-white font-mono px-3 py-1 shrink-0`}>
                        {result.status} {result.statusText}
                    </Badge>
                    {isUnexpected && (
                        <Badge variant="outline" className="gap-1 border-amber-400 text-amber-600 dark:text-amber-400 text-[10px]">
                            <TriangleAlert className="h-3 w-3" />
                            Unexpected status
                        </Badge>
                    )}
                </div>
                <span className="text-xs text-muted-foreground">Finished in <span className="font-semibold">{result.duration} ms</span> · <span className="font-semibold">{bodySize}</span></span>
            </div>

            {Object.keys(result.headers).length > 0 && (
                <Collapsible open={headersOpen} onOpenChange={setHeadersOpen}>
                    <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${headersOpen ? 'rotate-90' : ''}`} />
                        Response headers ({Object.keys(result.headers).length})
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="mt-2 rounded-md border border-border/60 divide-y divide-border/40 text-xs font-mono overflow-hidden">
                            {Object.entries(result.headers).map(([key, val]) => (
                                <div key={key} className="flex gap-3 px-3 py-1.5 odd:bg-muted/30">
                                    <span className="text-muted-foreground shrink-0 w-36 truncate">{key}</span>
                                    <span className="text-foreground break-all">{val}</span>
                                </div>
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            )}

            {resolved.body ? (
                <FormattedMarkdown
                    markdown={resolved.body}
                    languageCode={resolved.lang === 'text' ? undefined : resolved.lang}
                    maxLines={20}
                    className="[&_code]:!whitespace-pre-wrap !border !rounded-lg !border-slate-200 dark:!border-slate-700"
                />
            ) : (
                <p className="text-xs text-muted-foreground italic">Empty response body.</p>
            )}
        </div>
    );
};

export default PlaygroundResponse;

import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WrapText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ParameterObject, RequestBodyObject } from '@/types/unified-openapi-types';
import { getTypeColorClass } from './SchemaBadges';
import { Switch } from '@/components/ui/switch';

const LOCATION_STYLES: Record<string, string> = {
    path: 'border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/40',
    query: 'border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40',
    header: 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40',
};

type SetRecord = React.Dispatch<React.SetStateAction<Record<string, string>>>;

interface PlaygroundFormProps {
    parameters: ParameterObject[];
    requestBody?: RequestBodyObject;
    pathValues: Record<string, string>;
    setPathValues: SetRecord;
    queryValues: Record<string, string>;
    setQueryValues: SetRecord;
    headerValues: Record<string, string>;
    setHeaderValues: SetRecord;
    body: string;
    setBody: (v: string) => void;
    contentType: string;
    setContentType: (v: string) => void;
    contentTypes: string[];
    validationErrors: string[];
    enabledParams: Record<string, boolean>;
    setParamEnabled: (key: string, enabled: boolean) => void;
}

const SectionTitle: React.FC<{ label: string }> = ({ label }) => (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
);

const ParamRow: React.FC<{
    param: ParameterObject;
    value: string;
    onChange: (name: string, value: string) => void;
    isInvalid?: boolean;
    enabled: boolean;
    onToggle: () => void;
}> = ({ param, value, onChange, isInvalid, enabled, onToggle }) => (
    <div className={cn('space-y-1', !enabled && 'opacity-40')}>
        <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
                <span className={`font-mono text-xs font-medium ${param.deprecated ? 'line-through opacity-50' : ''}`}>
                    {param.name}{param.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                {LOCATION_STYLES[param.in] && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-normal ${LOCATION_STYLES[param.in]}`}>
                        {param.in}
                    </Badge>
                )}
                {param.schema?.type && (
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-mono font-normal ${getTypeColorClass(String(param.schema.type))}`}>
                        {String(param.schema.type)}
                    </Badge>
                )}
            </div>
            {!param.required && param.in !== 'path' && (
                <Switch checked={enabled} onCheckedChange={onToggle} className="shrink-0 scale-75" />
            )}
        </div>
        {Array.isArray(param.schema?.enum) && param.schema.enum.length > 0 ? (
            <Select value={value} onValueChange={v => onChange(param.name, v)} disabled={!enabled || param.deprecated === true}>
                <SelectTrigger className={cn('h-7 text-xs font-mono w-full', isInvalid && 'border-red-400 focus-visible:ring-red-400')}>
                    <SelectValue placeholder={param.description ?? param.name} />
                </SelectTrigger>
                <SelectContent>
                    {(param.schema.enum as unknown[]).map(v => (
                        <SelectItem key={String(v)} value={String(v)} className="text-xs font-mono">{String(v)}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : (
            <Input
                value={value}
                onChange={e => onChange(param.name, e.target.value)}
                placeholder={param.description ?? param.name}
                className={cn('h-7 text-xs font-mono w-full', isInvalid && 'border-red-400 focus-visible:ring-red-400')}
                disabled={!enabled || param.deprecated === true}
            />
        )}
    </div>
);

const PlaygroundForm: React.FC<PlaygroundFormProps> = ({
    parameters,
    requestBody,
    pathValues, setPathValues,
    queryValues, setQueryValues,
    headerValues, setHeaderValues,
    body, setBody,
    contentType, setContentType,
    contentTypes,
    validationErrors,
    enabledParams,
    setParamEnabled,
}) => {
    const pathParams = parameters.filter(p => p.in === 'path');
    const queryParams = parameters.filter(p => p.in === 'query');
    const headerParams = parameters.filter(p => p.in === 'header');
    const hasBody = !!requestBody;
    const hasContent = pathParams.length > 0 || queryParams.length > 0 || headerParams.length > 0 || hasBody;

    const handlePath = (name: string, val: string) => setPathValues(prev => ({ ...prev, [name]: val }));
    const handleQuery = (name: string, val: string) => setQueryValues(prev => ({ ...prev, [name]: val }));
    const handleHeader = (name: string, val: string) => setHeaderValues(prev => ({ ...prev, [name]: val }));
    const isEnabled = (p: ParameterObject) => enabledParams[`${p.in}:${p.name}`] !== false;

    return (
        <div className="space-y-5">
            {!hasContent && (
                <p className="text-sm text-muted-foreground italic text-center py-4">No parameters.</p>
            )}

            {pathParams.length > 0 && (
                <div className="space-y-3">
                    <SectionTitle label="Path" />
                    {pathParams.map(p => (
                        <ParamRow key={p.name} param={p} value={pathValues[p.name] ?? ''} onChange={handlePath} isInvalid={validationErrors.includes(`${p.in}:${p.name}`)} enabled={isEnabled(p)} onToggle={() => setParamEnabled(`${p.in}:${p.name}`, !isEnabled(p))} />
                    ))}
                </div>
            )}

            {queryParams.length > 0 && (
                <div className="space-y-3">
                    <SectionTitle label="Query" />
                    {queryParams.map(p => (
                        <ParamRow key={p.name} param={p} value={queryValues[p.name] ?? ''} onChange={handleQuery} isInvalid={validationErrors.includes(`${p.in}:${p.name}`)} enabled={isEnabled(p)} onToggle={() => setParamEnabled(`${p.in}:${p.name}`, !isEnabled(p))} />
                    ))}
                </div>
            )}

            {headerParams.length > 0 && (
                <div className="space-y-3">
                    <SectionTitle label="Headers" />
                    {headerParams.map(p => (
                        <ParamRow key={p.name} param={p} value={headerValues[p.name] ?? ''} onChange={handleHeader} isInvalid={validationErrors.includes(`${p.in}:${p.name}`)} enabled={isEnabled(p)} onToggle={() => setParamEnabled(`${p.in}:${p.name}`, !isEnabled(p))} />
                    ))}
                </div>
            )}

            {hasBody && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <SectionTitle label="Body" />
                            {contentType.includes('json') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        try {
                                            setBody(JSON.stringify(JSON.parse(body), null, 2));
                                        } catch {
                                            toast.error('Invalid JSON — cannot format.');
                                        }
                                    }}
                                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <WrapText className="h-3 w-3" />
                                    Format
                                </button>
                            )}
                        </div>
                        {contentTypes.length > 1 ? (
                            <Select value={contentType} onValueChange={setContentType}>
                                <SelectTrigger className="w-40 h-6 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {contentTypes.map(ct => (
                                        <SelectItem key={ct} value={ct} className="text-xs">{ct}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            contentTypes[0] && <Badge variant="outline" className="text-xs font-mono">{contentTypes[0]}</Badge>
                        )}
                    </div>

                    <textarea
                        value={body}
                        onChange={e => setBody(e.target.value)}
                        rows={8}
                        spellCheck={false}
                        placeholder='{"key": "value"}'
                        className={cn(
                            'w-full text-xs font-mono rounded-md border border-input bg-background px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y',
                            validationErrors.includes('__body__') && 'border-red-400 focus-visible:ring-red-400'
                        )}
                    />
                </div>
            )}

        </div>
    );
};

export default PlaygroundForm;

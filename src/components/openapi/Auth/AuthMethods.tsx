import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Key, Lock, KeyRound, UserCheck, ShieldCheck, CheckCircle2, X
} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { AuthorizeButton } from "@/components/openapi/Auth/AuthButton";
import { SecuritySchemeObject, AuthCredential } from "@/types/unified-openapi-types";
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";

type AuthComponent = React.FC<{ scheme: SecuritySchemeObject; schemeName: string }>;

const UnsupportedAuthMethod: AuthComponent = () => (
    <p className="text-sm text-muted-foreground">Unsupported authentication method.</p>
);

const AuthenticatedBadge: React.FC<{ onClear: () => void }> = ({ onClear }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="text-sm text-green-700 dark:text-green-400 flex-1">Authenticated</span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onClear}>
            <X className="h-3 w-3 mr-1" />
            Clear
        </Button>
    </div>
);

// --- Basic Auth ---

type HttpScheme = Extract<SecuritySchemeObject, { type: 'http' | 'basic' }>;

export const BasicAuthMethod: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'basic' }> | undefined;

    const [username, setUsername] = useState(saved?.username ?? '');
    const [password, setPassword] = useState(saved?.password ?? '');

    const authorize = () => {
        if (!username.trim()) return;
        setCredential(schemeName, { type: 'basic', username: username.trim(), password });
    };

    const clear = () => {
        clearCredential(schemeName);
        setUsername('');
        setPassword('');
    };

    return (
        <div className="space-y-4">
            {(scheme as HttpScheme).description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={(scheme as HttpScheme).description!} />
                </div>
            )}
            {saved && <AuthenticatedBadge onClear={clear} />}
            <div className="space-y-2">
                <Input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                />
                <Input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                />
            </div>
            <AuthorizeButton onClick={authorize} />
        </div>
    );
};

// --- Bearer Token ---

export const BearerTokenMethod: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'bearer' }> | undefined;

    const [token, setToken] = useState(saved?.token ?? '');

    const authorize = () => {
        if (!token.trim()) return;
        setCredential(schemeName, { type: 'bearer', token: token.trim() });
    };

    const clear = () => {
        clearCredential(schemeName);
        setToken('');
    };

    const httpScheme = scheme as HttpScheme;

    return (
        <div className="space-y-4">
            {httpScheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={httpScheme.description} />
                </div>
            )}
            {httpScheme.bearerFormat && (
                <p className="text-xs text-muted-foreground">Expected format: {httpScheme.bearerFormat}</p>
            )}
            {saved && <AuthenticatedBadge onClear={clear} />}
            <Input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Bearer token"
            />
            <AuthorizeButton onClick={authorize} />
        </div>
    );
};

// --- API Key ---

type ApiKeyScheme = Extract<SecuritySchemeObject, { type: 'apiKey' }>;

export const ApiKeyMethod: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'apiKey' }> | undefined;
    const apiKeyScheme = scheme as ApiKeyScheme;

    const [apiKey, setApiKey] = useState(saved?.key ?? '');

    const authorize = () => {
        if (!apiKey.trim()) return;
        setCredential(schemeName, {
            type: 'apiKey',
            key: apiKey.trim(),
            in: apiKeyScheme.in as 'header' | 'query' | 'cookie',
            name: apiKeyScheme.name,
        });
    };

    const clear = () => {
        clearCredential(schemeName);
        setApiKey('');
    };

    return (
        <div className="space-y-4">
            {apiKeyScheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={apiKeyScheme.description} />
                </div>
            )}
            <p className="text-xs text-muted-foreground">
                Sent as <code className="font-mono bg-muted px-1 rounded">{apiKeyScheme.name}</code> in{' '}
                <span className="font-medium">{apiKeyScheme.in}</span>
            </p>
            {saved && <AuthenticatedBadge onClear={clear} />}
            <Input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={apiKeyScheme.name}
            />
            <AuthorizeButton onClick={authorize} />
        </div>
    );
};

// --- OAuth2 ---

type OAuth2Scheme = Extract<SecuritySchemeObject, { type: 'oauth2' }>;

export const OAuth2Method: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'oauth2' }> | undefined;
    const oauth2Scheme = scheme as OAuth2Scheme;

    type FlowType = keyof OAuth2Scheme['flows'];
    const availableFlows = Object.keys(oauth2Scheme.flows) as FlowType[];
    const [selectedFlow, setSelectedFlow] = useState<FlowType>(availableFlows[0]!);

    const flow = oauth2Scheme.flows[selectedFlow];

    return (
        <div className="space-y-4">
            {oauth2Scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={oauth2Scheme.description} />
                </div>
            )}
            {saved && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                    <span className="text-sm text-green-700 dark:text-green-400 flex-1">
                        Authenticated — {saved.tokenType} token
                        {saved.scope && <span className="text-xs ml-1">({saved.scope})</span>}
                    </span>
                </div>
            )}

            {availableFlows.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {availableFlows.map(f => (
                        <Button
                            key={f}
                            variant={selectedFlow === f ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedFlow(f)}
                        >
                            {f}
                        </Button>
                    ))}
                </div>
            )}

            {flow && (
                <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                    {'authorizationUrl' in flow && (
                        <p><span className="font-medium text-foreground">Authorization URL:</span>{' '}
                            <code className="font-mono text-xs break-all">{flow.authorizationUrl}</code>
                        </p>
                    )}
                    {'tokenUrl' in flow && flow.tokenUrl && (
                        <p><span className="font-medium text-foreground">Token URL:</span>{' '}
                            <code className="font-mono text-xs break-all">{flow.tokenUrl}</code>
                        </p>
                    )}
                    {Object.keys(flow.scopes ?? {}).length > 0 && (
                        <div>
                            <p className="font-medium text-foreground mb-1">Scopes:</p>
                            <ul className="space-y-0.5">
                                {Object.entries(flow.scopes ?? {}).map(([scope, desc]) => (
                                    <li key={scope} className="text-xs">
                                        <code className="font-mono bg-muted px-1 rounded">{scope}</code>
                                        {desc && <span className="ml-1 text-muted-foreground">{desc}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <p className="text-xs text-muted-foreground italic">
                OAuth2 flows — coming soon.
            </p>
        </div>
    );
};

// --- OpenID Connect ---

type OpenIdScheme = Extract<SecuritySchemeObject, { type: 'openIdConnect' }>;

export const OpenIDMethod: AuthComponent = ({ scheme }) => {
    const openIdScheme = scheme as OpenIdScheme;

    return (
        <div className="space-y-4">
            {openIdScheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={openIdScheme.description} />
                </div>
            )}
            <div className="space-y-1">
                <p className="text-xs text-muted-foreground">OpenID Connect URL</p>
                <Input value={openIdScheme.openIdConnectUrl} readOnly className="font-mono text-xs" />
            </div>
            <p className="text-xs text-muted-foreground italic">OpenID Connect — coming soon.</p>
        </div>
    );
};

// --- Factory ---

export const getAuthMethodComponent = (scheme: SecuritySchemeObject): AuthComponent => {
    switch (scheme.type) {
        case 'http':
        case 'basic':
            if (scheme.scheme === 'basic') return BasicAuthMethod;
            if (scheme.scheme === 'bearer') return BearerTokenMethod;
            return UnsupportedAuthMethod;
        case 'apiKey':
            return ApiKeyMethod;
        case 'oauth2':
            return OAuth2Method;
        case 'openIdConnect':
            return OpenIDMethod;
        default:
            return UnsupportedAuthMethod;
    }
};

export const getSchemeIcon = (type: SecuritySchemeObject['type']) => {
    switch (type) {
        case 'http':
        case 'basic':
            return <UserCheck className="w-4 h-4 mr-1.5" />;
        case 'apiKey':
            return <Key className="w-4 h-4 mr-1.5" />;
        case 'oauth2':
            return <Lock className="w-4 h-4 mr-1.5" />;
        case 'openIdConnect':
            return <ShieldCheck className="w-4 h-4 mr-1.5" />;
        default:
            return <KeyRound className="w-4 h-4 mr-1.5" />;
    }
};

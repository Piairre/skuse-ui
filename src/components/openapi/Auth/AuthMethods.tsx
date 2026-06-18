import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Key, Lock, KeyRound, UserCheck, ShieldCheck, CheckCircle2, X, ExternalLink, AlertCircle
} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { AuthorizeButton } from "@/components/openapi/Auth/AuthButton";
import { SecuritySchemeObject, AuthCredential } from "@/types/unified-openapi-types";
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";
import { generateCodeVerifier, generateCodeChallenge } from "@/utils/pkce";
import { saveOAuthPending } from "@/hooks/useOAuthCallback";

type AuthComponent = React.FC<{ scheme: SecuritySchemeObject; schemeName: string }>;

const UnsupportedAuthMethod: AuthComponent = () => (
    <p className="text-sm text-muted-foreground">Unsupported authentication method.</p>
);

const AuthenticatedBadge: React.FC<{ onClear: () => void; detail?: string }> = ({ onClear, detail }) => (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
        <span className="text-sm text-green-700 dark:text-green-400 flex-1">
            Authenticated{detail && <span className="text-xs ml-1 opacity-70">({detail})</span>}
        </span>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200" onClick={onClear}>
            <X className="h-3 w-3 mr-1" />
            Clear
        </Button>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {children}
    </div>
);

const InlineError: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>{message}</span>
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
                <p className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={(scheme as HttpScheme).description!} />
                </p>
            )}
            {saved && <AuthenticatedBadge onClear={clear} />}
            <div className="space-y-3">
                <Field label="Username">
                    <Input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
                </Field>
                <Field label="Password">
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                </Field>
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
                <p className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={httpScheme.description} />
                </p>
            )}
            {saved && <AuthenticatedBadge onClear={clear} />}
            <Field label={`Token${httpScheme.bearerFormat ? ` (${httpScheme.bearerFormat})` : ''}`}>
                <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Bearer token" />
            </Field>
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
                <p className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={apiKeyScheme.description} />
                </p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                <Key className="h-3 w-3 shrink-0" />
                Sent as <code className="font-mono mx-1 text-foreground">{apiKeyScheme.name}</code> in <span className="font-medium text-foreground ml-1">{apiKeyScheme.in}</span>
            </div>
            {saved && <AuthenticatedBadge onClear={clear} />}
            <Field label="API Key">
                <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={apiKeyScheme.name} />
            </Field>
            <AuthorizeButton onClick={authorize} />
        </div>
    );
};

// --- OAuth2 ---

type OAuth2Scheme = Extract<SecuritySchemeObject, { type: 'oauth2' }>;
type FlowType = keyof OAuth2Scheme['flows'];

export const OAuth2Method: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'oauth2' }> | undefined;
    const oauth2Scheme = scheme as OAuth2Scheme;

    const availableFlows = Object.keys(oauth2Scheme.flows) as FlowType[];
    const [selectedFlow, setSelectedFlow] = useState<FlowType>(availableFlows[0]!);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);

    const flow = oauth2Scheme.flows[selectedFlow];
    const availableScopes = Object.entries(flow?.scopes ?? {});
    const redirectUri = `${window.location.origin}${window.location.pathname}`;

    const scopeString = selectedScopes.size > 0
        ? Array.from(selectedScopes).join(' ')
        : availableScopes.map(([s]) => s).join(' ');

    const toggleScope = useCallback((scope: string) => {
        setSelectedScopes(prev => {
            const next = new Set(prev);
            if (next.has(scope)) next.delete(scope); else next.add(scope);
            return next;
        });
    }, []);

    const selectAllScopes = () => setSelectedScopes(new Set(availableScopes.map(([s]) => s)));
    const clearScopes = () => setSelectedScopes(new Set());

    const clear = () => clearCredential(schemeName);

    const openPopup = (url: string) => {
        const w = 600, h = 700;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(url, 'skuse_oauth', `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`);
        if (!popup) {
            toast.error('Popup blocked', { description: 'Allow popups for this site and try again.' });
            return;
        }

        let resultReceived = false;
        const onMessage = (e: MessageEvent) => {
            if (e.origin === window.location.origin && e.data?.type === 'skuse_oauth_result') {
                resultReceived = true;
            }
        };
        window.addEventListener('message', onMessage);

        const interval = setInterval(() => {
            if (popup.closed) {
                clearInterval(interval);
                window.removeEventListener('message', onMessage);
                if (!resultReceived) {
                    toast.info('Authentication cancelled');
                }
            }
        }, 500);
    };

    const authorizeAuthorizationCode = async () => {
        if (!flow || !('authorizationUrl' in flow) || !clientId.trim()) return;

        const verifier = generateCodeVerifier();
        const challenge = await generateCodeChallenge(verifier);

        saveOAuthPending({
            schemeName,
            flow: 'authorizationCode',
            tokenUrl: 'tokenUrl' in flow ? flow.tokenUrl : undefined,
            codeVerifier: verifier,
            clientId: clientId.trim(),
            redirectUri,
        });

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: clientId.trim(),
            redirect_uri: redirectUri,
            scope: scopeString,
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state: crypto.randomUUID(),
        });

        openPopup(`${flow.authorizationUrl}?${params}`);
    };

    const authorizeImplicit = () => {
        if (!flow || !('authorizationUrl' in flow) || !clientId.trim()) return;

        saveOAuthPending({
            schemeName,
            flow: 'implicit',
            clientId: clientId.trim(),
            redirectUri,
        });

        const params = new URLSearchParams({
            response_type: 'token',
            client_id: clientId.trim(),
            redirect_uri: redirectUri,
            scope: scopeString,
        });

        openPopup(`${flow.authorizationUrl}?${params}`);
    };

    const authorizePassword = async () => {
        if (!flow || !('tokenUrl' in flow) || !clientId.trim() || !username.trim()) return;
        setError(null);

        const body = new URLSearchParams({
            grant_type: 'password',
            client_id: clientId.trim(),
            username: username.trim(),
            password,
            scope: scopeString,
        });
        if (clientSecret) body.set('client_secret', clientSecret);

        try {
            const res = await fetch(flow.tokenUrl!, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
            const data = await res.json();
            if (data.access_token) {
                setCredential(schemeName, { type: 'oauth2', accessToken: data.access_token, tokenType: data.token_type ?? 'Bearer', scope: data.scope });
            } else {
                setError(data.error_description ?? data.error ?? 'No access token returned');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not reach token endpoint');
        }
    };

    const authorizeClientCredentials = async () => {
        if (!flow || !('tokenUrl' in flow) || !clientId.trim()) return;
        setError(null);

        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: clientId.trim(),
            client_secret: clientSecret,
            scope: scopeString,
        });

        try {
            const res = await fetch(flow.tokenUrl!, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
            const data = await res.json();
            if (data.access_token) {
                setCredential(schemeName, { type: 'oauth2', accessToken: data.access_token, tokenType: data.token_type ?? 'Bearer', scope: data.scope });
            } else {
                setError(data.error_description ?? data.error ?? 'No access token returned');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not reach token endpoint');
        }
    };

    const flowLabel: Record<FlowType, string> = {
        authorizationCode: 'Authorization Code',
        implicit: 'Implicit',
        password: 'Password',
        clientCredentials: 'Client Credentials',
    };

    return (
        <div className="space-y-4">
            {oauth2Scheme.description && (
                <div className="text-sm text-muted-foreground">
                    <FormattedMarkdown markdown={oauth2Scheme.description} />
                </div>
            )}

            {saved && (
                <AuthenticatedBadge onClear={clear} detail={[saved.tokenType, saved.scope].filter(Boolean).join(' · ')} />
            )}

            {availableFlows.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {availableFlows.map(f => (
                        <Button key={f} variant={selectedFlow === f ? 'default' : 'outline'} size="sm"
                            onClick={() => { setSelectedFlow(f); setSelectedScopes(new Set()); }}>
                            {flowLabel[f] ?? f}
                        </Button>
                    ))}
                </div>
            )}

            {flow && (
                <div className="space-y-1.5 text-xs bg-muted/50 rounded-lg p-3">
                    <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Flow: </span>
                        {flowLabel[selectedFlow] ?? selectedFlow}
                    </p>
                    {'authorizationUrl' in flow && flow.authorizationUrl && (
                        <p className="text-muted-foreground flex items-start gap-1">
                            <span className="font-medium text-foreground shrink-0">Authorization URL: </span>
                            <span className="font-mono break-all">{flow.authorizationUrl}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                        </p>
                    )}
                    {'tokenUrl' in flow && flow.tokenUrl && (
                        <p className="text-muted-foreground flex items-start gap-1">
                            <span className="font-medium text-foreground shrink-0">Token URL: </span>
                            <span className="font-mono break-all">{flow.tokenUrl}</span>
                        </p>
                    )}
                </div>
            )}

            {availableScopes.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-foreground">Scopes</p>
                        <div className="flex gap-2">
                            <button className="text-xs text-primary hover:underline" onClick={selectAllScopes}>select all</button>
                            <span className="text-xs text-muted-foreground">/</span>
                            <button className="text-xs text-primary hover:underline" onClick={clearScopes}>select none</button>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        {availableScopes.map(([scope, desc]) => (
                            <label key={scope} className="flex items-start gap-2 cursor-pointer group">
                                <Checkbox
                                    checked={selectedScopes.has(scope)}
                                    onCheckedChange={() => toggleScope(scope)}
                                    className="mt-0.5 shrink-0"
                                />
                                <span className="text-xs leading-none pt-0.5">
                                    <code className="font-mono">{scope}</code>
                                    {desc && <span className="ml-1 text-muted-foreground">{desc as string}</span>}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <Field label="Client ID">
                    <Input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="client_id" />
                </Field>

                {selectedFlow === 'clientCredentials' && (
                    <Field label="Client Secret">
                        <Input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="client_secret" />
                    </Field>
                )}

                {selectedFlow === 'password' && (
                    <>
                        <Field label="Username">
                            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
                        </Field>
                        <Field label="Password">
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                        </Field>
                    </>
                )}
            </div>

            {error && <InlineError message={error} />}

            {selectedFlow === 'authorizationCode' && <AuthorizeButton onClick={authorizeAuthorizationCode} />}
            {selectedFlow === 'implicit' && <AuthorizeButton onClick={authorizeImplicit} />}
            {selectedFlow === 'password' && <AuthorizeButton onClick={authorizePassword} />}
            {selectedFlow === 'clientCredentials' && <AuthorizeButton onClick={authorizeClientCredentials} />}
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

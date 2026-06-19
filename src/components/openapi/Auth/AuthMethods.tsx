import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Key, Lock, KeyRound, UserCheck, ShieldCheck, CheckCircle2, X, ExternalLink, RefreshCw, Loader2, Info
} from 'lucide-react';
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";
import { AuthorizeButton } from "@/components/openapi/Auth/AuthButton";
import { SecuritySchemeObject, AuthCredential } from "@/types/unified-openapi-types";
import { useOpenAPIContext } from "@/hooks/OpenAPIContext";
import { generateCodeVerifier, generateCodeChallenge } from "@/utils/pkce";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

type AuthComponent = React.FC<{ scheme: SecuritySchemeObject; schemeName: string }>;

const UnsupportedAuthMethod: AuthComponent = () => (
    <p className="text-sm text-muted-foreground">Unsupported authentication method.</p>
);

const AuthenticatedBadge: React.FC<{
    onClear: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    detail?: string;
}> = ({ onClear, onRefresh, isRefreshing, detail }) => (
    <div className="flex flex-col gap-3 px-4 py-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">Authenticated</p>
                {detail && <p className="text-xs text-green-600/70 dark:text-green-400/70 truncate">{detail}</p>}
            </div>
        </div>
        <div className="flex gap-2">
            {onRefresh && (
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                >
                    {isRefreshing
                        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Refresh
                </Button>
            )}
            <Button
                variant="outline"
                size="sm"
                className={`${onRefresh ? 'flex-1' : 'w-full'} border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900`}
                onClick={onClear}
                disabled={isRefreshing}
            >
                <X className="h-3.5 w-3.5 mr-1.5" />
                Log out
            </Button>
        </div>
    </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {children}
    </div>
);

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
    </Tooltip>
);

// --- Basic Auth ---

type HttpScheme = Extract<SecuritySchemeObject, { type: 'http' | 'basic' }>;

export const BasicAuthMethod: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'basic' }> | undefined;

    const [username, setUsername] = useState(saved?.username ?? '');
    const [password, setPassword] = useState(saved?.password ?? '');

    const authorize = () => {
        if (!username.trim()) { toast.warning('Username is required'); return; }
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
            {saved ? <AuthenticatedBadge onClear={clear} /> : (
                <>
                    <div className="space-y-3">
                        <Field label="Username">
                            <Input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
                        </Field>
                        <Field label="Password">
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                        </Field>
                    </div>
                    <AuthorizeButton onClick={authorize} />
                </>
            )}
        </div>
    );
};

// --- Bearer Token ---

export const BearerTokenMethod: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'bearer' }> | undefined;

    const [token, setToken] = useState(saved?.token ?? '');

    const authorize = () => {
        if (!token.trim()) { toast.warning('Token is required'); return; }
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
            {saved ? <AuthenticatedBadge onClear={clear} /> : (
                <>
                    <Field label={`Token${httpScheme.bearerFormat ? ` (${httpScheme.bearerFormat})` : ''}`}>
                        <Input type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="Bearer token" />
                    </Field>
                    <AuthorizeButton onClick={authorize} />
                </>
            )}
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
        if (!apiKey.trim()) { toast.warning('API key is required'); return; }
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
            {saved ? <AuthenticatedBadge onClear={clear} /> : (
                <>
                    <Field label="API Key">
                        <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={apiKeyScheme.name} />
                    </Field>
                    <AuthorizeButton onClick={authorize} />
                </>
            )}
        </div>
    );
};

// --- OAuth2 ---

type OAuth2Scheme = Extract<SecuritySchemeObject, { type: 'oauth2' }>;
type FlowType = keyof OAuth2Scheme['flows'];

export const OAuth2Method: AuthComponent = ({ scheme, schemeName }) => {
    const { credentials, setCredential, clearCredential, computedUrl } = useOpenAPIContext();
    const saved = credentials[schemeName] as Extract<AuthCredential, { type: 'oauth2' }> | undefined;
    const oauth2Scheme = scheme as OAuth2Scheme;

    const availableFlows = Object.keys(oauth2Scheme.flows) as FlowType[];
    const [selectedFlow, setSelectedFlow] = useState<FlowType>(availableFlows[0]!);
    const [clientId, setClientId] = useState('');
    const [clientSecret, setClientSecret] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedScopes, setSelectedScopes] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [credentialsLocation, setCredentialsLocation] = useState<'body' | 'header'>('header');
    const [usePkce, setUsePkce] = useState(true);
    const pkceVerifierRef = useRef<string | null>(null);

    const flow = oauth2Scheme.flows[selectedFlow];
    const availableScopes = Object.entries(flow?.scopes ?? {});
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const hasTokenUrl = flow && 'tokenUrl' in flow && !!flow.tokenUrl;

    const scopeString = selectedScopes.size > 0
        ? Array.from(selectedScopes).join(' ')
        : availableScopes.map(([s]) => s).join(' ');

    // Resolve relative OAuth URLs against active server
    const resolveUrl = (url: string): string => {
        if (!url) return url;
        try { new URL(url); return url; } catch { /* relative */ }
        try { return new URL(url, computedUrl || window.location.origin).toString(); } catch { return url; }
    };

    // POST to token endpoint — credentials in body (default) or Authorization header (RFC 6749)
    const fetchToken = (url: string, body: URLSearchParams): Promise<Response> => {
        if (credentialsLocation === 'header' && clientId.trim()) {
            const encoded = btoa(`${clientId.trim()}:${clientSecret}`);
            body.delete('client_id');
            body.delete('client_secret');
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Basic ${encoded}` },
                body: body.toString(),
            });
        }
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
        });
    };

    // Extract token from response using optional x-tokenName extension
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTokenResponse = (data: Record<string, any>, defaultScope?: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokenName = (flow as any)?.['x-tokenName'] ?? 'access_token';
        if (data[tokenName]) {
            setCredential(schemeName, {
                type: 'oauth2',
                accessToken: data[tokenName],
                tokenType: data.token_type ?? 'Bearer',
                scope: data.scope ?? defaultScope,
                refreshToken: data.refresh_token,
                clientId: clientId.trim() || undefined,
            });
            return true;
        }
        toast.error(data.error_description ?? data.error ?? 'No access token returned');
        return false;
    };

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

    // Opens popup, polls popup.location.href (CORS until provider redirects back to our origin)
    const openPopup = (url: string): Promise<string> =>
        new Promise((resolve, reject) => {
            const w = 600, h = 700;
            const left = window.screenX + (window.outerWidth - w) / 2;
            const top = window.screenY + (window.outerHeight - h) / 2;
            const popup = window.open(url, 'skuse_oauth', `width=${w},height=${h},left=${left},top=${top},scrollbars=yes,resizable=yes`);
            if (!popup) {
                toast.error('Popup blocked', { description: 'Allow popups for this site and try again.' });
                reject(new Error('blocked'));
                return;
            }
            const interval = setInterval(() => {
                if (popup.closed) {
                    clearInterval(interval);
                    toast.info('Authentication cancelled');
                    reject(new Error('cancelled'));
                    return;
                }
                try {
                    const href = popup.location.href;
                    if (!href || href === 'about:blank') return;
                    clearInterval(interval);
                    popup.close();
                    resolve(href);
                } catch { /* CORS — still on provider origin, keep polling */ }
            }, 200);
        });

    const authorizeAuthorizationCode = async () => {
        if (!clientId.trim()) { toast.warning('Client ID is required'); return; }
        if (!flow || !('authorizationUrl' in flow) || !('tokenUrl' in flow) || !flow.tokenUrl) return;
        setIsLoading(true);
        try {
            const state = crypto.randomUUID();
            const params = new URLSearchParams({
                response_type: 'code',
                client_id: clientId.trim(),
                redirect_uri: redirectUri,
                scope: scopeString,
                state,
            });

            if (usePkce) {
                const verifier = generateCodeVerifier();
                pkceVerifierRef.current = verifier;
                const challenge = await generateCodeChallenge(verifier);
                params.set('code_challenge', challenge);
                params.set('code_challenge_method', 'S256');
            }

            let callbackHref: string;
            try { callbackHref = await openPopup(`${resolveUrl(flow.authorizationUrl)}?${params}`); }
            catch { return; }

            const cb = new URL(callbackHref);
            const cbError = cb.searchParams.get('error');
            if (cbError) { toast.error(cb.searchParams.get('error_description') ?? cbError); return; }
            if (cb.searchParams.get('state') !== state) { toast.error('State mismatch — possible CSRF attack'); return; }
            const code = cb.searchParams.get('code');
            if (!code) { toast.error('No authorization code returned'); return; }

            const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: clientId.trim() });
            if (usePkce && pkceVerifierRef.current) { body.set('code_verifier', pkceVerifierRef.current); pkceVerifierRef.current = null; }
            if (clientSecret && credentialsLocation === 'body') body.set('client_secret', clientSecret);
            try {
                const res = await fetchToken(resolveUrl(flow.tokenUrl), body);
                handleTokenResponse(await res.json(), scopeString);
            } catch (e) {
                toast.error('Could not reach token endpoint', { description: e instanceof Error ? e.message : undefined });
            }
        } finally { setIsLoading(false); }
    };

    const authorizeImplicit = async () => {
        if (!clientId.trim()) { toast.warning('Client ID is required'); return; }
        if (!flow || !('authorizationUrl' in flow)) return;
        setIsLoading(true);
        try {
            const state = crypto.randomUUID();
            const params = new URLSearchParams({
                response_type: 'token',
                client_id: clientId.trim(),
                redirect_uri: redirectUri,
                scope: scopeString,
                state,
            });

            let callbackHref: string;
            try { callbackHref = await openPopup(`${resolveUrl(flow.authorizationUrl)}?${params}`); }
            catch { return; }

            const cb = new URL(callbackHref);
            const hash = new URLSearchParams(cb.hash.slice(1));
            const cbError = cb.searchParams.get('error') ?? hash.get('error');
            if (cbError) { toast.error(cb.searchParams.get('error_description') ?? hash.get('error_description') ?? cbError); return; }
            const returnedState = cb.searchParams.get('state') ?? hash.get('state');
            if (returnedState && returnedState !== state) { toast.error('State mismatch — possible CSRF attack'); return; }
            const token = hash.get('access_token') ?? cb.searchParams.get('access_token');
            if (!token) { toast.error('No access token returned'); return; }
            setCredential(schemeName, {
                type: 'oauth2',
                accessToken: token,
                tokenType: hash.get('token_type') ?? 'Bearer',
                scope: hash.get('scope') ?? undefined,
                clientId: clientId.trim(),
            });
        } finally { setIsLoading(false); }
    };

    const authorizePassword = async () => {
        if (!clientId.trim()) { toast.warning('Client ID is required'); return; }
        if (!username.trim()) { toast.warning('Username is required'); return; }
        if (!flow || !('tokenUrl' in flow)) return;
        setIsLoading(true);
        try {
            const body = new URLSearchParams({ grant_type: 'password', client_id: clientId.trim(), username: username.trim(), password, scope: scopeString });
            if (clientSecret && credentialsLocation === 'body') body.set('client_secret', clientSecret);
            const res = await fetchToken(resolveUrl(flow.tokenUrl!), body);
            handleTokenResponse(await res.json(), scopeString);
        } catch (e) {
            toast.error('Could not reach token endpoint', { description: e instanceof Error ? e.message : undefined });
        } finally { setIsLoading(false); }
    };

    const authorizeClientCredentials = async () => {
        if (!clientId.trim()) { toast.warning('Client ID is required'); return; }
        if (!flow || !('tokenUrl' in flow)) return;
        setIsLoading(true);
        try {
            const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId.trim(), scope: scopeString });
            if (clientSecret && credentialsLocation === 'body') body.set('client_secret', clientSecret);
            const res = await fetchToken(resolveUrl(flow.tokenUrl!), body);
            handleTokenResponse(await res.json(), scopeString);
        } catch (e) {
            toast.error('Could not reach token endpoint', { description: e instanceof Error ? e.message : undefined });
        } finally { setIsLoading(false); }
    };

    const refreshOAuth2Token = async () => {
        if (!saved?.refreshToken) return;
        const tokenUrl = flow && 'refreshUrl' in flow && flow.refreshUrl
            ? resolveUrl(flow.refreshUrl)
            : flow && 'tokenUrl' in flow && flow.tokenUrl
                ? resolveUrl(flow.tokenUrl)
                : null;
        if (!tokenUrl) return;
        setIsLoading(true);
        try {
            const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: saved.refreshToken });
            if (saved.clientId) body.set('client_id', saved.clientId);
            const res = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
            const data = await res.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const tokenName = (flow as any)?.['x-tokenName'] ?? 'access_token';
            if (data[tokenName]) {
                setCredential(schemeName, {
                    type: 'oauth2',
                    accessToken: data[tokenName],
                    tokenType: data.token_type ?? saved.tokenType,
                    scope: data.scope ?? saved.scope,
                    refreshToken: data.refresh_token ?? saved.refreshToken,
                    clientId: saved.clientId,
                });
            } else {
                toast.error(data.error_description ?? data.error ?? 'Token refresh failed');
            }
        } catch (e) {
            toast.error('Could not reach token endpoint', { description: e instanceof Error ? e.message : undefined });
        } finally { setIsLoading(false); }
    };

    const canRefresh = !!saved?.refreshToken && (
        (flow && 'refreshUrl' in flow && !!flow.refreshUrl) ||
        (flow && 'tokenUrl' in flow && !!flow.tokenUrl)
    );

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

            {saved ? (
                <AuthenticatedBadge
                    onClear={clear}
                    onRefresh={canRefresh ? refreshOAuth2Token : undefined}
                    isRefreshing={isLoading}
                    detail={[saved.tokenType, saved.scope].filter(Boolean).join(' · ')}
                />
            ) : (<>

            {availableFlows.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {availableFlows.map(f => (
                        <Button key={f} variant={selectedFlow === f ? 'default' : 'outline'} size="sm"
                            onClick={() => { setSelectedFlow(f); setSelectedScopes(new Set()); setIsLoading(false); }}>
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
                            <span className="font-mono truncate">{resolveUrl(flow.authorizationUrl)}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 mt-0.5" />
                        </p>
                    )}
                    {'tokenUrl' in flow && flow.tokenUrl && (
                        <p className="text-muted-foreground flex items-start gap-1">
                            <span className="font-medium text-foreground shrink-0">Token URL: </span>
                            <span className="font-mono truncate">{resolveUrl(flow.tokenUrl)}</span>
                        </p>
                    )}
                </div>
            )}

            {availableScopes.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between shrink-0">
                        <p className="text-xs font-medium text-foreground">Scopes</p>
                        <div className="flex gap-2">
                            <button className="text-xs text-primary hover:underline" onClick={selectAllScopes}>select all</button>
                            <span className="text-xs text-muted-foreground">/</span>
                            <button className="text-xs text-primary hover:underline" onClick={clearScopes}>select none</button>
                        </div>
                    </div>
                    <div className="space-y-1.5 overflow-y-auto max-h-40 pr-1">
                        {availableScopes.map(([scope, desc]) => (
                            <label key={scope} className="flex items-start gap-2 cursor-pointer group">
                                <Checkbox checked={selectedScopes.has(scope)} onCheckedChange={() => toggleScope(scope)} className="mt-0.5 shrink-0" />
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

                {(selectedFlow === 'clientCredentials' || selectedFlow === 'password') && (
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

            {hasTokenUrl && (
                <Field label="Client credentials">
                    <div className="flex gap-2">
                        {(['header', 'body'] as const).map(loc => (
                            <Button key={loc} size="sm" variant={credentialsLocation === loc ? 'default' : 'outline'}
                                className="flex-1 text-xs" onClick={() => setCredentialsLocation(loc)}>
                                {loc === 'header' ? 'Auth header' : 'Request body'}
                            </Button>
                        ))}
                    </div>
                </Field>
            )}

            {selectedFlow === 'authorizationCode' && (
                <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox checked={usePkce} onCheckedChange={v => setUsePkce(!!v)} />
                    <span className="text-xs text-foreground">Use PKCE</span>
                    <InfoTooltip text="Proof Key for Code Exchange — generates a one-time code challenge so the authorization code can't be stolen and reused by a third party." />
                </label>
            )}

            {selectedFlow === 'authorizationCode' && <AuthorizeButton onClick={authorizeAuthorizationCode} isLoading={isLoading} />}
            {selectedFlow === 'implicit' && <AuthorizeButton onClick={authorizeImplicit} isLoading={isLoading} />}
            {selectedFlow === 'password' && <AuthorizeButton onClick={authorizePassword} isLoading={isLoading} />}
            {selectedFlow === 'clientCredentials' && <AuthorizeButton onClick={authorizeClientCredentials} isLoading={isLoading} />}

            </>)}
        </div>
    );
};

// --- OpenID Connect ---

type OpenIdScheme = Extract<SecuritySchemeObject, { type: 'openIdConnect' }>;

export const OpenIDMethod: AuthComponent = ({ scheme, schemeName }) => {
    const openIdScheme = scheme as OpenIdScheme;
    const [discoveredScheme, setDiscoveredScheme] = useState<SecuritySchemeObject | null>(null);
    const [discovering, setDiscovering] = useState(false);

    const discover = async () => {
        setDiscovering(true);
        try {
            const res = await fetch(openIdScheme.openIdConnectUrl);
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const config: Record<string, any> = await res.json();

            const scopes: Record<string, string> = {};
            for (const s of (config.scopes_supported ?? ['openid'])) scopes[s] = '';

            const oauth2: SecuritySchemeObject = {
                type: 'oauth2',
                description: openIdScheme.description,
                flows: {
                    ...(config.authorization_endpoint && config.token_endpoint ? {
                        authorizationCode: {
                            authorizationUrl: config.authorization_endpoint,
                            tokenUrl: config.token_endpoint,
                            refreshUrl: config.token_endpoint,
                            scopes,
                        }
                    } : {}),
                    ...(config.authorization_endpoint && !config.token_endpoint ? {
                        implicit: {
                            authorizationUrl: config.authorization_endpoint,
                            scopes,
                        }
                    } : {}),
                },
            };
            setDiscoveredScheme(oauth2);
        } catch (e) {
            toast.error('OIDC discovery failed', { description: e instanceof Error ? e.message : undefined });
        } finally {
            setDiscovering(false);
        }
    };

    useEffect(() => { discover(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (discoveredScheme) {
        return <OAuth2Method scheme={discoveredScheme} schemeName={schemeName} />;
    }

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
            <Button variant="outline" className="w-full" onClick={discover} disabled={discovering}>
                {discovering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                {discovering ? 'Discovering…' : 'Retry discovery'}
            </Button>
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

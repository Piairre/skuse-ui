import { useEffect } from 'react';
import { toast } from 'sonner';
import { useOpenAPIContext } from './OpenAPIContext';

const PENDING_KEY = 'skuse_oauth_pending';
const MESSAGE_TYPE = 'skuse_oauth_result';

export interface OAuthPendingState {
    schemeName: string;
    flow: 'authorizationCode' | 'implicit';
    tokenUrl?: string;
    codeVerifier?: string;
    clientId: string;
    redirectUri: string;
}

interface OAuthResultMessage {
    type: typeof MESSAGE_TYPE;
    schemeName: string;
    accessToken?: string;
    tokenType?: string;
    scope?: string;
    error?: string;
}

export function saveOAuthPending(state: OAuthPendingState) {
    // localStorage is shared across windows (unlike sessionStorage)
    localStorage.setItem(PENDING_KEY, JSON.stringify(state));
}

export function useOAuthCallback() {
    const { setCredential } = useOpenAPIContext();

    // Main window: listen for result or error posted by the popup
    useEffect(() => {
        const handleMessage = (event: MessageEvent<OAuthResultMessage>) => {
            if (event.origin !== window.location.origin) return;
            if (event.data?.type !== MESSAGE_TYPE) return;

            if (event.data.error) {
                toast.error('OAuth authentication failed', { description: event.data.error });
                return;
            }

            if (event.data.accessToken) {
                setCredential(event.data.schemeName, {
                    type: 'oauth2',
                    accessToken: event.data.accessToken,
                    tokenType: event.data.tokenType ?? 'Bearer',
                    scope: event.data.scope,
                });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setCredential]);

    // Popup window: detect OAuth callback, exchange code, post result, close
    useEffect(() => {
        if (!window.opener) return;

        const params = new URLSearchParams(window.location.search);
        const hash = new URLSearchParams(window.location.hash.replace('#', ''));

        const code = params.get('code');
        const implicitToken = hash.get('access_token');
        const oauthError = params.get('error');

        // Provider returned an error (e.g. user denied access)
        if (oauthError) {
            const description = params.get('error_description')?.replace(/\+/g, ' ') ?? oauthError;
            window.opener.postMessage(
                { type: MESSAGE_TYPE, schemeName: '', error: description } satisfies OAuthResultMessage,
                window.location.origin
            );
            window.close();
            return;
        }

        if (!code && !implicitToken) return;

        const pendingRaw = localStorage.getItem(PENDING_KEY);
        if (!pendingRaw) return;

        const pending: OAuthPendingState = JSON.parse(pendingRaw);
        localStorage.removeItem(PENDING_KEY);

        const postResult = (payload: Omit<OAuthResultMessage, 'type'>) => {
            window.opener.postMessage(
                { type: MESSAGE_TYPE, ...payload } satisfies OAuthResultMessage,
                window.location.origin
            );
            window.close();
        };

        // Implicit flow — token is in the hash fragment
        if (pending.flow === 'implicit' && implicitToken) {
            postResult({
                schemeName: pending.schemeName,
                accessToken: implicitToken,
                tokenType: hash.get('token_type') ?? 'Bearer',
                scope: hash.get('scope') ?? undefined,
            });
            return;
        }

        // Authorization code flow — exchange code for token
        if (pending.flow === 'authorizationCode' && code && pending.tokenUrl) {
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: pending.redirectUri,
                client_id: pending.clientId,
            });
            if (pending.codeVerifier) body.set('code_verifier', pending.codeVerifier);

            fetch(pending.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
            })
                .then(r => r.json())
                .then(data => {
                    if (data.access_token) {
                        postResult({
                            schemeName: pending.schemeName,
                            accessToken: data.access_token,
                            tokenType: data.token_type ?? 'Bearer',
                            scope: data.scope ?? undefined,
                        });
                    } else {
                        const msg = data.error_description ?? data.error ?? 'No access token returned';
                        postResult({ schemeName: pending.schemeName, error: msg });
                    }
                })
                .catch(err => {
                    postResult({ schemeName: pending.schemeName, error: err?.message ?? 'Network error during token exchange' });
                });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

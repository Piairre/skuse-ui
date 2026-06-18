function base64urlEncode(buffer: Uint8Array): string {
    return btoa(Array.from(buffer, b => String.fromCharCode(b)).join(''))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

export function generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64urlEncode(array);
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlEncode(new Uint8Array(digest));
}

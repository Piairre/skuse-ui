import React from 'react';
import { Button } from "@/components/ui/button";
import { Lock, Loader2, UnlockKeyhole } from 'lucide-react';
import { SecuritySchemeObject } from "@/types/unified-openapi-types";
import AuthDialog from './AuthDialog';
import { useOpenAPIContext } from '@/hooks/OpenAPIContext';

interface AuthButtonProps {
    securitySchemes?: Record<string, SecuritySchemeObject>;
}

export const AuthorizeButton = React.forwardRef<HTMLButtonElement, { onClick?: () => void; isLoading?: boolean }>(
    ({ onClick, isLoading }, ref) => (
        <Button
            ref={ref}
            variant="outline"
            className="w-full p-2 border rounded-md border-green-500 text-green-500 hover:bg-green-500 hover:text-white disabled:opacity-60 disabled:pointer-events-none"
            onClick={onClick}
            disabled={isLoading}
        >
            {isLoading
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <Lock className="w-4 h-4 mr-2" />}
            {isLoading ? 'Authorizing…' : 'Authorize'}
        </Button>
    )
);

const AuthButton: React.FC<AuthButtonProps> = ({ securitySchemes }) => {
    const { credentials } = useOpenAPIContext();
    const hasSecuritySchemes = securitySchemes && Object.keys(securitySchemes).length > 0;

    if (!hasSecuritySchemes) {
        return (
            <div className="cursor-not-allowed w-full">
                <Button
                    variant="secondary"
                    className="w-full p-2 border rounded-lg opacity-50 pointer-events-none"
                >
                    <Lock className="w-4 h-4 mr-2" />
                    No Auth
                </Button>
            </div>
        );
    }

    const isAuthenticated = Object.keys(securitySchemes).some(name => credentials[name]);

    return (
        <AuthDialog securitySchemes={securitySchemes}>
            {isAuthenticated ? (
                <Button className="w-full p-2 rounded-md bg-green-500 hover:bg-green-600 text-white border-0">
                    <UnlockKeyhole className="w-4 h-4 mr-2" />
                    Authorized
                </Button>
            ) : (
                <AuthorizeButton />
            )}
        </AuthDialog>
    );
};

export default AuthButton;
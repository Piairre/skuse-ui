import React from 'react';
import { Button } from "@/components/ui/button";
import { Lock } from 'lucide-react';
import { SecuritySchemeObject } from "@/types/unified-openapi-types";
import AuthDialog from './AuthDialog';

interface AuthButtonProps {
    securitySchemes?: Record<string, SecuritySchemeObject>;
    variant?: 'default' | 'outline' | 'secondary';
    className?: string;
}

export const AuthorizeButton = React.forwardRef<HTMLButtonElement, { onClick?: () => void;}>(
    ({ onClick, }, ref) => (
        <Button
            ref={ref}
            variant="outline"
            className="w-full p-2 border rounded-md border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
            onClick={onClick}
        >
            <Lock className="w-4 h-4 mr-2" />
            Authorize
        </Button>
    )
);

const AuthButton: React.FC<AuthButtonProps> = ({securitySchemes, variant = 'outline'}) => {
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

    return (
        <AuthDialog securitySchemes={securitySchemes}>
            <AuthorizeButton variant={variant} />
        </AuthDialog>
    );
};

export default AuthButton;
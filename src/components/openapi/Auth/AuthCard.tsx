import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { SecuritySchemeObject } from "@/types/unified-openapi-types";
import AuthButton from './AuthButton';

interface AuthCardProps {
    securitySchemes?: Record<string, SecuritySchemeObject>;
}

const AuthCard: React.FC<AuthCardProps> = ({ securitySchemes }) => {
    return (
        <div className="space-y-3">
            <AuthButton securitySchemes={securitySchemes} />
        </div>
    );
};

export default AuthCard;
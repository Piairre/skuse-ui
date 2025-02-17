import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck } from 'lucide-react';
import { SecuritySchemeObject } from "@/types/unified-openapi-types";
import AuthButton from './AuthButton';

interface AuthCardProps {
    securitySchemes?: Record<string, SecuritySchemeObject>;
}

const AuthCard: React.FC<AuthCardProps> = ({ securitySchemes }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center text-xl font-semibold">
                    <ShieldCheck className="mr-2 h-5 w-5 text-primary"/>
                    Authentication
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <AuthButton
                    securitySchemes={securitySchemes}
                    className="w-full p-2"
                />
            </CardContent>
        </Card>
    );
};

export default AuthCard;
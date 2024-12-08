import React from 'react';
import {Card, CardHeader, CardTitle, CardDescription, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {
    ExternalLink,
    BookOpenText,
    Scale,
    Contact2,
    Mail,
    Earth, ScrollText
} from 'lucide-react';
import {OpenAPIV3} from "openapi-types";
import FormattedMarkdown from "@/components/openapi/FormattedMarkdown";

interface OpenAPIHeaderProps {
    document: OpenAPIV3.Document;
}

const Header: React.FC<OpenAPIHeaderProps> = ({document}) => {
    // Provide default values and handle potential undefined cases
    const info = document?.info ?? {
        title: 'API Documentation',
        version: '1.0.0',
        description: '',
        contact: undefined,
        license: undefined,
        termsOfService: undefined
    };

    const externalDocs = document?.externalDocs;

    return (
        <Card className="w-full mx-auto">
            <CardHeader>
                <div className="flex">
                    <Badge variant="outline"
                           className="border-black text-black hover:bg-black hover:text-white flex justify-center items-center px-3 py-1 w-24 me-2">
                        API: {info.version}
                    </Badge>
                    <Badge variant="outline"
                           className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white flex justify-center items-center px-3 py-1 w-24">
                        OAS: {document.openapi}
                    </Badge>
                </div>

                <CardTitle className="text-2xl font-bold">
                    {info.title}
                </CardTitle>

                {info.description && (
                    <CardDescription className="mt-2">
                        <FormattedMarkdown markdown={info.description}/>
                    </CardDescription>
                )}
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid lg:grid-cols-4 gap-4">
                    {info.contact && (
                        <div className="flex items-center space-x-3 p-3 bg-secondary/40 rounded-lg">
                            <div>
                                <h3 className="flex items-center mb-2 font-semibold">
                                    <Contact2 className="w-5 h-5 mr-2 text-primary"/>
                                    Contact
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <p>{info.contact.name || 'Contact'}</p>
                                    {info.contact.email && (
                                        <a href={`mailto:${info.contact.email}`}
                                           className="flex items-center text-blue-600 hover:underline">
                                            <Mail className="w-4 h-4 text-primary"/>
                                        </a>
                                    )}
                                    {info.contact.url && (
                                        <a href={info.contact.url} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center text-blue-600 hover:underline">
                                            <Earth className="w-4 h-4 text-primary"/>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {info.license && (
                        <div className="flex items-center space-x-3 p-3 bg-secondary/40 rounded-lg">
                            <div>
                                <h3 className="flex items-center mb-2 font-semibold">
                                    <Scale className="w-5 h-5 mr-2 text-primary"/>
                                    License
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <p>{info.license.name}</p>
                                    {info.license.url && (
                                        <a href={info.license.url} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center text-blue-600 hover:underline">
                                            <ExternalLink className="w-4 h-4 text-primary"/>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {info.termsOfService && (
                        <div className="flex items-center space-x-3 p-3 bg-secondary/40 rounded-lg">
                            <div>
                                <h3 className="flex items-center mb-2 font-semibold">
                                    <ScrollText className="w-5 h-5 mr-2 text-primary"/>
                                    Terms of Service
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <p>View</p>
                                    <a href={info.termsOfService} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center text-blue-600 hover:underline">
                                        <ExternalLink className="w-4 h-4 text-primary"/>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {externalDocs && (
                        <div className="flex items-center space-x-3 p-3 bg-secondary/40 rounded-lg">
                            <div>
                                <h3 className="flex items-center mb-2 font-semibold">
                                    <BookOpenText className="w-5 h-5 mr-2 text-primary"/>
                                    External Documentation
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <p>{externalDocs.description || 'View'}</p>
                                    <a href={externalDocs.url} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center text-blue-600 hover:underline">
                                        <ExternalLink className="w-4 h-4 text-primary"/>
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default Header;

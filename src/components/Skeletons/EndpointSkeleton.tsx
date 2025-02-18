import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EndpointSkeleton = () => {
    return (
        <div className="flex-1 m-4">
            <Card className="w-full">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-20 rounded-md" />
                        <div>
                            <Skeleton className="h-6 w-96" />
                            <Skeleton className="h-4 w-64 mt-1" />
                        </div>
                    </div>
                </div>

                <div className="container grid grid-cols-5 gap-6 p-4">
                    <div className="col-span-3">
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList>
                                {['Info', 'Parameters', 'Request Body', 'Responses'].map((tab) => (
                                    <TabsTrigger key={tab} value={tab.toLowerCase()} disabled>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-4" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <div className="mt-4 border rounded-lg p-4">
                                <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-11/12" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            </div>
                        </Tabs>
                    </div>

                    <div className="col-span-2 border-l pl-6">
                        <div className="sticky top-4">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-8 w-32" />
                                </div>
                                <div className="space-y-2 bg-muted rounded-lg p-4">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Skeleton key={i} className="h-4 w-full" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default EndpointSkeleton;
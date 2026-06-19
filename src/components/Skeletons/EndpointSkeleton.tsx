import React from 'react';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EndpointSkeleton = () => {
    return (
        <Card className="w-full rounded-none border-x-0 border-t-0 md:rounded-lg md:border">
            <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b">
                <Skeleton className="h-8 w-20 rounded-md shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                    <Skeleton className="h-5 w-64 max-w-full" />
                    <Skeleton className="h-4 w-40 max-w-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-4">
                <div className="lg:col-span-3">
                    <Tabs defaultValue="info" className="w-full">
                        <TabsList className="w-full">
                            {['Info', 'Parameters', 'Body', 'Responses'].map((tab) => (
                                <TabsTrigger key={tab} value={tab.toLowerCase()} disabled className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-4" />
                                        <Skeleton className="h-4 w-12" />
                                    </div>
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        <div className="mt-4 border rounded-lg p-4 space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-11/12" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    </Tabs>
                </div>

                <div className="lg:col-span-2 lg:border-l lg:pl-6">
                    <div className="lg:sticky lg:top-20 space-y-4">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                        <div className="space-y-2 bg-muted rounded-lg p-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default EndpointSkeleton;

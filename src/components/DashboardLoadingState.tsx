'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading component for dashboard content
 */
export default function DashboardLoadingState() {
  return (
    <div className="h-screen flex flex-col">
      {/* Animated header */}
      <div className="p-4 border-b border-muted-foreground/20 bg-background">
        <Skeleton className="h-8 w-40" />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Animated sidebar */}
        <div className="w-64 p-4 border-r border-muted-foreground/20 bg-background">
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-32 w-full mt-6" />
          </div>
        </div>
        
        {/* Animated main content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-8 w-32" />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <Skeleton className="h-10 w-full" />
                </Card>
              ))}
            </div>
            
            <Card className="p-5">
              <Skeleton className="h-6 w-48 mb-4" />
              
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
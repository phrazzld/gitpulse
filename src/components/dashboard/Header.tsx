'use client';

import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface HeaderProps {
  /**
   * Name of the current user
   */
  userName?: string | null;
  
  /**
   * URL of the user's profile image
   */
  userImage?: string | null;
  
  /**
   * Callback URL to navigate to after signing out
   */
  signOutCallbackUrl?: string;
  
  /**
   * Whether to show the command terminal label
   */
  showCommandTerminal?: boolean;
}

/**
 * Dashboard header component with user info and sign out button
 */
export default function Header({
  userName,
  userImage,
  signOutCallbackUrl = '/',
  showCommandTerminal = true
}: HeaderProps) {
  const handleSignOut = () => {
    signOut({ callbackUrl: signOutCallbackUrl });
  };
  
  return (
    <header className="border-b bg-card">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-3 animate-pulse" />
          <h1 className="text-2xl font-bold">
            GitPulse
          </h1>
          {showCommandTerminal && (
            <Badge variant="outline" className="ml-4">
              Command Terminal
            </Badge>
          )}
        </div>
        
        {userImage && (
          <div className="flex items-center">
            {userName && (
              <Badge variant="secondary" className="mr-3">
                User: {userName}
              </Badge>
            )}
            <div className="relative">
              <Image
                src={userImage}
                alt={userName || 'User'}
                width={36}
                height={36}
                className="rounded-full ring-2 ring-primary ring-offset-2 ring-offset-background"
              />
            </div>
            <Button
              onClick={handleSignOut}
              variant="destructive"
              size="sm"
              className="ml-4"
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
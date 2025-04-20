import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/library";
import type { Session } from "next-auth";

/**
 * Props for the UserProfileSection component
 */
export interface UserProfileSectionProps {
  /**
   * User session information from NextAuth
   * When provided, user account UI with profile picture (if available) will be shown
   * When not provided or null, login button will be shown instead
   */
  session?: Session | null;
}

/**
 * UserProfileSection component
 *
 * Displays either the signed-in user profile or a sign-in button based on authentication state
 */
export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  session,
}) => {
  return (
    <div className="ml-auto flex items-center gap-sm md:gap-md">
      {session ? (
        <div className="flex items-center gap-sm">
          {session.user?.image && (
            <Image
              src={session.user.image}
              alt=""
              width={32}
              height={32}
              className="rounded-full w-8 h-8 border border-dark-slate/20 shadow-sm"
              aria-hidden="true"
            />
          )}
          <span className="text-sm font-medium text-foreground hidden sm:inline-block">
            {session.user?.name || "User"}
          </span>
          <Button
            variant="secondary"
            size="sm"
            aria-label="Account menu"
            className="ml-xs md:ml-sm"
          >
            <span className="sr-only">Account menu</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </div>
      ) : (
        <Link href="/api/auth/signin" className="no-underline">
          <Button
            variant="primary"
            size="sm"
            className="shadow-sm hover:shadow-md transition-shadow duration-normal"
          >
            Sign In
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UserProfileSection;

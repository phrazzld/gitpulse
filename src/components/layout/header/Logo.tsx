import React from "react";
import Link from "next/link";
import Image from "next/image";

/**
 * Props for the Logo component
 */
export interface LogoProps {
  /**
   * Optional text to display as the logo
   * @default "GitPulse"
   */
  logoText?: string;

  /**
   * Optional URL for a logo image
   * When provided, an image will be shown next to the logo text
   * If not provided, a default globe icon will be used
   * @example "/logo.svg" or "https://example.com/logo.png"
   */
  logoImageUrl?: string;
}

/**
 * Logo component
 *
 * Displays the application logo with optional custom text and image
 */
export const Logo: React.FC<LogoProps> = ({
  logoText = "GitPulse",
  logoImageUrl,
}) => {
  return (
    <div className="flex-shrink-0">
      <Link
        href="/"
        className="flex items-center gap-2 no-underline transition-transform hover:scale-105"
        aria-label="Go to homepage"
      >
        {logoImageUrl ? (
          <Image
            src={logoImageUrl}
            alt=""
            width={32}
            height={32}
            className="w-8 h-8"
            aria-hidden="true"
          />
        ) : (
          <Image
            src="/globe.svg"
            alt=""
            width={24}
            height={24}
            className="w-6 h-6"
            aria-hidden="true"
          />
        )}
        <span className="text-lg md:text-xl font-bold text-primary">
          {logoText}
        </span>
      </Link>
    </div>
  );
};

export default Logo;

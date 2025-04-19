import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NavLink } from "@/types/navigation";
import "../styles/tokens.css";
import "./globals.css";
import Providers from "./providers";

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GitPulse - GitHub Commit Summary",
  description: "Summarize GitHub commits for individuals and teams",
};

// Define main navigation links
const mainNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard", requiresAuth: true },
  { label: "Documentation", href: "/docs" },
];

// Define footer links
const footerLinks: NavLink[] = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "About", href: "/about" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the current session server-side for navigation
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${robotoMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <Header navLinks={mainNavLinks} session={session} />
          <div className="flex-grow">{children}</div>
          <Footer
            links={footerLinks}
            copyrightText="© 2025 GitPulse. All rights reserved."
          />
        </Providers>
      </body>
    </html>
  );
}

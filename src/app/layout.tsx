import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NavLink } from "@/types/navigation";
import Providers from "./providers";
import "@/app/globals.css";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${robotoMono.variable} font-mono antialiased min-h-screen flex flex-col`}
      >
        <Providers>
          <Header navLinks={mainNavLinks} session={session} />
          <main className="flex-grow">{children}</main>
          <Footer
            links={footerLinks}
            copyrightText="© 2025 GitPulse. All rights reserved."
          />
        </Providers>
      </body>
    </html>
  );
}

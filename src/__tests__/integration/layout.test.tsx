import React from "react";
import { mockSession } from "../test-utils";
import type { NavLink } from "@/types/navigation";
import type { Session } from "next-auth";

// Mock the next-auth/react module
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: mockSession,
    status: "authenticated",
  })),
  signOut: jest.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock the next/navigation module
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/"),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock getServerSession
jest.mock("next-auth", () => ({
  getServerSession: jest.fn().mockResolvedValue(mockSession),
}));

// Mock the AuthValidator component
jest.mock("@/components/AuthValidator", () => {
  return {
    AuthValidator: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

// Define prop types for our mock components
interface HeaderProps {
  navLinks: NavLink[];
  session?: Session | null;
  className?: string;
  logoText?: string;
  logoImageUrl?: string;
}

interface FooterProps {
  links?: NavLink[];
  copyrightText: string;
}

// Mock the Header component and track its props
let headerProps: HeaderProps | null = null;
jest.mock("@/components/layout/Header", () => {
  return function MockHeader(props: HeaderProps) {
    headerProps = props;
    return <div data-testid="header">Header Mock</div>;
  };
});

// Mock the Footer component and track its props
let footerProps: FooterProps | null = null;
jest.mock("@/components/layout/Footer", () => {
  return function MockFooter(props: FooterProps) {
    footerProps = props;
    return <div data-testid="footer">Footer Mock</div>;
  };
});

// Mock child content
const MockChildContent = () => (
  <div data-testid="child-content">Child content</div>
);

// Import the RootLayout directly to avoid require
import RootLayout from "@/app/layout";

describe("RootLayout Component Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    headerProps = null;
    footerProps = null;
  });

  it("renders header and footer components", async () => {
    // Generate layout without tracking the result
    await RootLayout({ children: <MockChildContent /> });

    // We don't actually need to render the layout - we just want to check that
    // the props are passed correctly to Header and Footer
    expect(headerProps).not.toBeNull();
    expect(footerProps).not.toBeNull();
  });

  it("passes correct navigation links to Header", async () => {
    await RootLayout({ children: <MockChildContent /> });

    // Need null checks to satisfy TypeScript
    if (!headerProps) {
      throw new Error("headerProps is null");
    }

    expect(headerProps.navLinks).toHaveLength(3);
    expect(headerProps.navLinks[0].label).toBe("Home");
    expect(headerProps.navLinks[0].href).toBe("/");
    expect(headerProps.navLinks[1].label).toBe("Dashboard");
    expect(headerProps.navLinks[1].href).toBe("/dashboard");
    expect(headerProps.navLinks[1].requiresAuth).toBe(true);
    expect(headerProps.navLinks[2].label).toBe("Documentation");
    expect(headerProps.navLinks[2].href).toBe("/docs");
  });

  it("passes session to Header component", async () => {
    await RootLayout({ children: <MockChildContent /> });

    if (!headerProps) {
      throw new Error("headerProps is null");
    }

    expect(headerProps.session).toEqual(mockSession);
  });

  it("passes correct links to Footer", async () => {
    await RootLayout({ children: <MockChildContent /> });

    if (!footerProps) {
      throw new Error("footerProps is null");
    }

    expect(footerProps.links).toHaveLength(3);
    expect(footerProps.links?.[0].label).toBe("Terms");
    expect(footerProps.links?.[0].href).toBe("/terms");
    expect(footerProps.links?.[1].label).toBe("Privacy");
    expect(footerProps.links?.[1].href).toBe("/privacy");
    expect(footerProps.links?.[2].label).toBe("About");
    expect(footerProps.links?.[2].href).toBe("/about");
  });

  it("displays correct copyright text in Footer", async () => {
    await RootLayout({ children: <MockChildContent /> });

    if (!footerProps) {
      throw new Error("footerProps is null");
    }

    expect(footerProps.copyrightText).toBe(
      "© 2025 GitPulse. All rights reserved.",
    );
  });
});

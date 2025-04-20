import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../Header";
import { NavigationMenu } from "../NavigationMenu";
import { NavLink } from "@/types/navigation";
import { logger } from "@/lib/logger";

// Mock the logger
jest.mock("@/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Next.js components and hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/dashboard"),
}));

// Define types for mocks
type MockImageProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

type MockLinkProps = {
  children: React.ReactNode;
  href: string;
  className?: string;
  "aria-label"?: string;
  onClick?: () => void;
  [prop: string]: unknown;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: MockImageProps) {
    return <img src={props.src} alt={props.alt} data-testid="mock-image" />;
  },
}));

jest.mock("next/link", () => {
  const MockLink = function MockLink({
    children,
    href,
    onClick,
    ...rest
  }: MockLinkProps) {
    return (
      <a href={href} onClick={onClick} {...rest}>
        {children}
      </a>
    );
  };
  return MockLink;
});

// Sample navigation links for testing
const mockNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Settings", href: "/settings", requiresAuth: true },
];

// Mock session data
const mockSession = {
  user: {
    name: "Test User",
    email: "test@example.com",
    image: "https://example.com/avatar.jpg",
  },
  expires: "2025-01-01T00:00:00.000Z",
};

describe("Navigation Logging Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Header Component Logging", () => {
    it("logs mobile menu toggle events", () => {
      render(<Header navLinks={mockNavLinks} />);

      // Find and click the mobile menu toggle button
      const toggleButton = screen.getByRole("button", {
        name: "Toggle navigation menu",
      });
      fireEvent.click(toggleButton);

      // Verify log was called with correct parameters
      expect(logger.info).toHaveBeenCalledWith(
        "Header",
        "Mobile menu opened",
        expect.objectContaining({
          action: "open_mobile_menu",
          path: "/dashboard",
          authenticated: false,
        }),
      );

      // Click again to close
      fireEvent.click(toggleButton);

      // Verify close log was called
      expect(logger.info).toHaveBeenCalledWith(
        "Header",
        "Mobile menu closed",
        expect.objectContaining({
          action: "close_mobile_menu",
          path: "/dashboard",
          authenticated: false,
        }),
      );
    });

    it("includes user info in logs when authenticated", () => {
      render(<Header navLinks={mockNavLinks} session={mockSession} />);

      // Find and click the mobile menu toggle button
      const toggleButton = screen.getByRole("button", {
        name: "Toggle navigation menu",
      });
      fireEvent.click(toggleButton);

      // Verify log includes user info
      expect(logger.info).toHaveBeenCalledWith(
        "Header",
        "Mobile menu opened",
        expect.objectContaining({
          action: "open_mobile_menu",
          userId: "test@example.com",
          authenticated: true,
        }),
      );
    });
  });

  describe("NavigationMenu Component Logging", () => {
    it("logs navigation link clicks", () => {
      render(<NavigationMenu links={mockNavLinks} currentPath="/dashboard" />);

      // Find and click the Home link (not the current page)
      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      // Verify log was called with correct parameters
      expect(logger.info).toHaveBeenCalledWith(
        "NavigationMenu",
        "Navigation to: Home (/)",
        expect.objectContaining({
          action: "navigation_link_click",
          destination: "/",
          linkLabel: "Home",
          navigationSource: "desktop",
          fromPath: "/dashboard",
          authenticated: false,
        }),
      );
    });

    it("does not log clicks on the current page", () => {
      render(<NavigationMenu links={mockNavLinks} currentPath="/dashboard" />);

      // Find and click the Dashboard link (current page)
      const dashboardLink = screen.getByText("Dashboard");
      fireEvent.click(dashboardLink);

      // Verify log was not called
      expect(logger.info).not.toHaveBeenCalled();
    });

    it("includes user info in navigation logs when provided", () => {
      render(
        <NavigationMenu
          links={mockNavLinks}
          currentPath="/dashboard"
          userId="test@example.com"
          isAuthenticated={true}
        />,
      );

      // Find and click the Home link
      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      // Verify log includes user info
      expect(logger.info).toHaveBeenCalledWith(
        "NavigationMenu",
        "Navigation to: Home (/)",
        expect.objectContaining({
          action: "navigation_link_click",
          userId: "test@example.com",
          authenticated: true,
        }),
      );
    });

    it("logs the correct navigation source based on orientation", () => {
      render(
        <NavigationMenu
          links={mockNavLinks}
          currentPath="/dashboard"
          orientation="vertical"
        />,
      );

      // Find and click the Home link
      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      // Verify log has correct navigation source
      expect(logger.info).toHaveBeenCalledWith(
        "NavigationMenu",
        "Navigation to: Home (/)",
        expect.objectContaining({
          navigationSource: "mobile",
        }),
      );
    });
  });
});

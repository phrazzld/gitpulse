import * as React from "react";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { Header } from "../Header";
import { NavLink } from "@/types/navigation";
import { mockSession } from "../../../__tests__/test-utils";

// Mock Next.js components and hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/dashboard"),
}));

// Type definitions for mocks
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
  [prop: string]: unknown;
};

jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: MockImageProps) {
    // We're using img element in tests only as a simplified mock
    return <img src={props.src} alt={props.alt} data-testid="mock-image" />;
  },
}));

jest.mock("next/link", () => {
  const MockLink = function MockLink({
    children,
    href,
    ...rest
  }: MockLinkProps) {
    return (
      <a href={href} {...rest}>
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

// Create an icon component for testing
const MockIcon = () => <svg data-testid="mock-icon" />;

describe("Header Component", () => {
  // Helper function for rendering the component
  const renderHeader = (props = {}) => {
    return render(<Header navLinks={mockNavLinks} {...props} />);
  };

  it("renders logo and desktop navigation in non-authenticated state", () => {
    renderHeader();

    // Logo should be present
    expect(screen.getByText("GitPulse")).toBeInTheDocument();

    // Desktop navigation should be visible and mobile nav hidden
    const desktopNav = screen.getByRole("navigation", {
      name: "Main Navigation",
    });
    expect(desktopNav).toBeInTheDocument();
    expect(desktopNav.parentElement).toHaveClass("hidden", "md:block");

    // Public links should be visible, auth-required links should not
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();

    // Sign-in button should be visible
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      "/api/auth/signin",
    );
  });

  it("renders authenticated user UI when session is provided", () => {
    renderHeader({ session: mockSession });

    // User name should be visible
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // User image should be present
    const userImages = screen.getAllByTestId("mock-image");
    // Find the user avatar (it will have the session image URL)
    const userAvatar = userImages.find(
      (img) => img.getAttribute("src") === mockSession.user.image,
    );
    expect(userAvatar).toBeDefined();
    expect(userAvatar).toHaveAttribute("src", mockSession.user.image);

    // Settings link should now be visible (requires auth)
    expect(screen.getByText("Settings")).toBeInTheDocument();

    // Account menu button should be present
    expect(
      screen.getByRole("button", { name: "Account menu" }),
    ).toBeInTheDocument();
  });

  it("toggles mobile menu when toggle button is clicked", () => {
    renderHeader();

    // Mobile menu should initially be hidden
    expect(
      screen.queryByRole("navigation", { name: "Mobile Navigation" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("mobile-navigation-menu"),
    ).not.toBeInTheDocument();

    // Find and click the mobile menu toggle button
    const toggleButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    expect(toggleButton).toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);

    // Mobile menu should now be visible
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile Navigation",
    });
    expect(mobileNav).toBeInTheDocument();

    // Check menu has vertical orientation
    expect(mobileNav.parentElement?.parentElement).toHaveClass("md:hidden");

    // Click toggle button again to close
    fireEvent.click(toggleButton);

    // Mobile menu should be hidden again
    expect(
      screen.queryByRole("navigation", { name: "Mobile Navigation" }),
    ).not.toBeInTheDocument();
  });

  it("displays custom logo text and image when provided", () => {
    const customLogoText = "Custom Brand";
    const customLogoUrl = "/custom-logo.svg";

    renderHeader({
      logoText: customLogoText,
      logoImageUrl: customLogoUrl,
    });

    // Custom logo text should be visible
    expect(screen.getByText(customLogoText)).toBeInTheDocument();

    // Custom logo image should be displayed
    const logoImages = screen.getAllByTestId("mock-image");
    // Find the logo image (will have the custom logo URL)
    const logoImage = logoImages.find(
      (img) => img.getAttribute("src") === customLogoUrl,
    );
    expect(logoImage).toBeDefined();
    expect(logoImage).toHaveAttribute("src", customLogoUrl);
  });

  it("renders links with icons when provided", () => {
    const linksWithIcons: NavLink[] = [
      { label: "Home", href: "/", icon: <MockIcon /> },
      { label: "Dashboard", href: "/dashboard" },
    ];

    renderHeader({ navLinks: linksWithIcons });

    // Toggle mobile menu to see all navigation items
    const toggleButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    fireEvent.click(toggleButton);

    // Icon should be rendered alongside the label
    const mobileNav = screen.getByRole("navigation", {
      name: "Mobile Navigation",
    });
    const homeLink = within(mobileNav).getByText("Home").closest("a");
    expect(homeLink).toBeInTheDocument();

    // Check that the icon is present if JavaScript DOM traversal is available
    if (homeLink) {
      expect(homeLink.innerHTML).toContain("data-testid");
    }
  });

  it("hides user name on small screens", () => {
    renderHeader({ session: mockSession });

    // User name element should have the hidden class for small screens
    const userName = screen.getByText("Test User");
    expect(userName).toHaveClass("hidden", "sm:inline-block");
  });
});

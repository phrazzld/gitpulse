import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestHeader } from "../Header.test-helper";
import { NavLink } from "@/types/navigation";
import { mockSession } from "../../../__tests__/test-utils";

// Mock Next.js components and hooks
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/dashboard"),
}));

// Mock Next.js components
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage(props: any) {
    // We're using img element in tests only as a simplified mock
    return <img src={props.src} alt={props.alt} data-testid="mock-image" />;
  },
}));

jest.mock("next/link", () => {
  const MockLink = function MockLink({ children, href, ...rest }: any) {
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
    return render(<TestHeader navLinks={mockNavLinks} {...props} />);
  };

  it("renders logo and desktop navigation in non-authenticated state", () => {
    renderHeader();

    // Logo should be present
    expect(screen.getByText("GitPulse")).toBeInTheDocument();

    // Desktop navigation should be visible
    const desktopNav = screen.getByTestId("desktop-nav");
    expect(desktopNav).toBeInTheDocument();

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
      screen.queryByTestId("mobile-navigation-menu"),
    ).not.toBeInTheDocument();

    // Find and click the mobile menu toggle button
    const toggleButton = screen.getByTestId("mobile-menu-toggle");
    expect(toggleButton).toBeInTheDocument();

    // Click to open
    fireEvent.click(toggleButton);

    // Mobile menu should now be visible
    const mobileNav = screen.getByTestId("mobile-navigation-menu");
    expect(mobileNav).toBeInTheDocument();

    // Click toggle button again to close
    fireEvent.click(toggleButton);

    // Mobile menu should be hidden again
    expect(
      screen.queryByTestId("mobile-navigation-menu"),
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
    const logoImage = screen.getByTestId("mock-image");
    expect(logoImage).toHaveAttribute("src", customLogoUrl);
  });

  it("renders links with icons when provided", () => {
    const linksWithIcons: NavLink[] = [
      { label: "Home", href: "/", icon: <MockIcon /> },
      { label: "Dashboard", href: "/dashboard" },
    ];

    renderHeader({ navLinks: linksWithIcons });

    // Toggle mobile menu to see all navigation items
    const toggleButton = screen.getByTestId("mobile-menu-toggle");
    fireEvent.click(toggleButton);

    // Check that items are rendered in desktop nav
    const desktopLinks = screen.getAllByTestId("nav-link");
    expect(desktopLinks.length).toBe(2);
    expect(desktopLinks[0]).toHaveTextContent("Home");
    expect(desktopLinks[1]).toHaveTextContent("Dashboard");
  });

  it("hides user name on small screens", () => {
    renderHeader({ session: mockSession });

    // User name element should have the hidden class for small screens
    const userName = screen.getByText("Test User");
    expect(userName).toHaveClass("hidden");
    expect(userName).toHaveClass("sm:inline-block");
  });
});

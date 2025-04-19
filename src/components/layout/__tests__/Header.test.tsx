import React from "react";
import { render, screen, fireEvent } from "../../../__tests__/test-utils";
import { Header } from "../Header";
import { NavLink } from "@/types/navigation";

// Mock the usePathname hook
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

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

describe("Header Component", () => {
  it("renders logo and desktop navigation", () => {
    render(<Header navLinks={mockNavLinks} />);

    // Logo should be present
    expect(screen.getByText("GitPulse")).toBeInTheDocument();

    // Desktop navigation should be visible
    expect(
      screen.getByRole("navigation", { name: "Main Navigation" }),
    ).toBeInTheDocument();

    // Home and Dashboard links should be visible (Settings requires auth)
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("renders authenticated user UI when session is provided", () => {
    render(<Header navLinks={mockNavLinks} session={mockSession} />);

    // User name should be visible
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Settings link should now be visible (requires auth)
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders sign in button when no session is provided", () => {
    render(<Header navLinks={mockNavLinks} />);

    // Sign In button should be visible
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("toggles mobile menu when mobile toggle is clicked", () => {
    render(<Header navLinks={mockNavLinks} />);

    // Mobile menu should initially be hidden
    expect(
      screen.queryByRole("navigation", { name: "Mobile Navigation" }),
    ).not.toBeInTheDocument();

    // Find and click the mobile menu toggle button
    const toggleButton = screen.getByRole("button", {
      name: "Toggle navigation menu",
    });
    fireEvent.click(toggleButton);

    // Mobile menu should now be visible
    expect(
      screen.getByRole("navigation", { name: "Mobile Navigation" }),
    ).toBeInTheDocument();

    // Click toggle button again
    fireEvent.click(toggleButton);

    // Mobile menu should be hidden again
    expect(
      screen.queryByRole("navigation", { name: "Mobile Navigation" }),
    ).not.toBeInTheDocument();
  });

  it("displays custom logo text when provided", () => {
    render(<Header navLinks={mockNavLinks} logoText="Custom Logo" />);

    expect(screen.getByText("Custom Logo")).toBeInTheDocument();
  });
});

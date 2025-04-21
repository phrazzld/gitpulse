import React from "react";
import { render, screen, fireEvent, act } from "@/__tests__/test-utils";
import { NavigationMenu } from "@/components/layout/NavigationMenu";
import { NavLink } from "@/types/navigation";

// Mock React Icons for testing
const MockIcon = () => <svg data-testid="mock-icon" />;

describe("NavigationMenu component", () => {
  const mockLinks: NavLink[] = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <MockIcon />,
    },
  ];

  // Basic rendering tests
  describe("rendering", () => {
    it("renders correctly with the provided links", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders nothing when links array is empty", () => {
      const { container } = render(
        <NavigationMenu links={[]} currentPath="/" />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders links with correct href attributes", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const homeLink = screen.getByText("Home").closest("a");
      const dashboardLink = screen.getByText("Dashboard").closest("a");
      const settingsLink = screen.getByText("Settings").closest("a");

      expect(homeLink).toHaveAttribute("href", "/");
      expect(dashboardLink).toHaveAttribute("href", "/dashboard");
      expect(settingsLink).toHaveAttribute("href", "/settings");
    });

    it("renders icons correctly", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
      expect(screen.getByTestId("mock-icon").closest("span")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });

  // Orientation tests
  describe("orientation", () => {
    it("applies horizontal orientation classes by default", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const menu = screen.getByRole("menubar");
      expect(menu).toHaveAttribute("aria-orientation", "horizontal");
      expect(menu).toHaveClass("flex-row");
    });

    it("applies vertical orientation classes when specified", () => {
      render(
        <NavigationMenu
          links={mockLinks}
          currentPath="/dashboard"
          orientation="vertical"
        />,
      );

      const menu = screen.getByRole("menubar");
      expect(menu).toHaveAttribute("aria-orientation", "vertical");
      expect(menu).toHaveClass("flex-col");
    });
  });

  // Active link tests
  describe("active link handling", () => {
    it("highlights the active link", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      // Get all buttons
      const dashboardButton = screen.getByText("Dashboard").closest("button");
      expect(dashboardButton).toHaveClass("bg-primary/15");
      expect(dashboardButton).toHaveClass("text-primary");
      expect(dashboardButton).toHaveClass("shadow-sm");
      expect(dashboardButton).toHaveClass("font-medium");
    });

    it("sets aria-current attribute on the active link", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink).toHaveAttribute("aria-current", "page");

      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).not.toHaveAttribute("aria-current");
    });

    it("makes only the active link tabbable", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      const homeLink = screen.getByText("Home").closest("a");
      const settingsLink = screen.getByText("Settings").closest("a");

      expect(dashboardLink).toHaveAttribute("tabIndex", "0");
      expect(homeLink).toHaveAttribute("tabIndex", "-1");
      expect(settingsLink).toHaveAttribute("tabIndex", "-1");
    });

    it("makes the first link tabbable when no link is active", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/nonexistent" />);

      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveAttribute("tabIndex", "0");
    });
  });

  // Accessibility tests
  describe("accessibility", () => {
    it("applies proper ARIA roles", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(screen.getByRole("menubar")).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(3);
    });

    it("uses the provided ariaLabel", () => {
      render(
        <NavigationMenu
          links={mockLinks}
          currentPath="/dashboard"
          ariaLabel="Test Navigation"
        />,
      );

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Test Navigation");
    });

    it("uses the default ariaLabel if not provided", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("aria-label", "Main Navigation");
    });

    it("applies the provided id to the navigation element", () => {
      render(
        <NavigationMenu
          links={mockLinks}
          currentPath="/dashboard"
          id="test-nav-id"
        />,
      );

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveAttribute("id", "test-nav-id");
    });

    it("generates a unique id if not provided", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const nav = screen.getByRole("navigation");
      expect(nav.id).toMatch(/^nav-menu-/);
    });
  });

  // Keyboard navigation tests
  describe("keyboard navigation", () => {
    it("navigates to the next item with ArrowRight key", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");

      act(() => {
        dashboardLink?.focus();
        fireEvent.keyDown(dashboardLink as HTMLElement, { key: "ArrowRight" });
      });

      // Settings should now have focus
      const settingsLink = screen.getByText("Settings").closest("a");
      expect(settingsLink).toHaveFocus();
    });

    it("navigates to the previous item with ArrowLeft key", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");

      act(() => {
        dashboardLink?.focus();
        fireEvent.keyDown(dashboardLink as HTMLElement, { key: "ArrowLeft" });
      });

      // Home should now have focus
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveFocus();
    });

    it("wraps around to the first item when at the end", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/settings" />);

      const settingsLink = screen.getByText("Settings").closest("a");

      act(() => {
        settingsLink?.focus();
        fireEvent.keyDown(settingsLink as HTMLElement, { key: "ArrowRight" });
      });

      // Home should now have focus (wrapped around)
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveFocus();
    });

    it("navigates to the first item with Home key", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/settings" />);

      const settingsLink = screen.getByText("Settings").closest("a");

      act(() => {
        settingsLink?.focus();
        fireEvent.keyDown(settingsLink as HTMLElement, { key: "Home" });
      });

      // Home should now have focus
      const homeLink = screen.getByText("Home").closest("a");
      expect(homeLink).toHaveFocus();
    });

    it("navigates to the last item with End key", () => {
      render(<NavigationMenu links={mockLinks} currentPath="/dashboard" />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");

      act(() => {
        dashboardLink?.focus();
        fireEvent.keyDown(dashboardLink as HTMLElement, { key: "End" });
      });

      // Settings should now have focus
      const settingsLink = screen.getByText("Settings").closest("a");
      expect(settingsLink).toHaveFocus();
    });
  });

  // Custom styling tests
  describe("custom styling", () => {
    it("applies custom className to the navigation element", () => {
      render(
        <NavigationMenu
          links={mockLinks}
          currentPath="/dashboard"
          className="custom-class"
        />,
      );

      const nav = screen.getByRole("navigation");
      expect(nav).toHaveClass("custom-class");
    });
  });
});

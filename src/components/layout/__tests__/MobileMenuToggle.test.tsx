import React from "react";
import { render, screen, fireEvent } from "@/__tests__/test-utils";
import { MobileMenuToggle } from "@/components/layout/MobileMenuToggle";

// Mock React Icon for testing
const MockIcon = () => <svg data-testid="mock-icon" />;

describe("MobileMenuToggle component", () => {
  // Basic rendering tests
  describe("rendering", () => {
    it("renders correctly in closed state", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("renders correctly in open state", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={true} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("renders default icon in closed state", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      const iconContainer = screen.getByRole("button").querySelector("div");
      expect(iconContainer).toBeInTheDocument();

      // Check for three line spans that make up the hamburger icon
      const lines = iconContainer?.querySelectorAll("span");
      expect(lines?.length).toBe(3);

      // Middle line should be visible in closed state
      expect(lines?.[1]).not.toHaveClass("opacity-0");
    });

    it("renders default icon in open state", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={true} onToggle={onToggle} />);

      const iconContainer = screen.getByRole("button").querySelector("div");
      expect(iconContainer).toBeInTheDocument();

      // Check for three line spans that make up the X icon
      const lines = iconContainer?.querySelectorAll("span");
      expect(lines?.length).toBe(3);

      // Middle line should be hidden in open state
      expect(lines?.[1]).toHaveClass("opacity-0");

      // First line should have rotate class
      expect(lines?.[0]).toHaveClass("rotate-45");

      // Last line should have rotate class
      expect(lines?.[2]).toHaveClass("-rotate-45");
    });

    it("renders custom open icon when provided", () => {
      const onToggle = jest.fn();
      render(
        <MobileMenuToggle
          isOpen={true}
          onToggle={onToggle}
          openIcon={<MockIcon />}
        />,
      );

      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    });

    it("renders custom closed icon when provided", () => {
      const onToggle = jest.fn();
      render(
        <MobileMenuToggle
          isOpen={false}
          onToggle={onToggle}
          closedIcon={<MockIcon />}
        />,
      );

      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    });
  });

  // Interaction tests
  describe("interactions", () => {
    it("calls onToggle when clicked", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole("button"));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("handles multiple clicks", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByRole("button"));
      expect(onToggle).toHaveBeenCalledTimes(2);
    });
  });

  // Accessibility tests
  describe("accessibility", () => {
    it("sets aria-expanded to match isOpen prop", () => {
      const onToggle = jest.fn();
      const { rerender } = render(
        <MobileMenuToggle isOpen={false} onToggle={onToggle} />,
      );

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      rerender(<MobileMenuToggle isOpen={true} onToggle={onToggle} />);
      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("sets aria-controls when menuId is provided", () => {
      const onToggle = jest.fn();
      render(
        <MobileMenuToggle
          isOpen={false}
          onToggle={onToggle}
          menuId="test-menu"
        />,
      );

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-controls",
        "test-menu",
      );
    });

    it("does not set aria-controls when menuId is not provided", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button.getAttribute("aria-controls")).toBeNull();
    });

    it("uses default aria-label when not provided", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Toggle mobile menu",
      );
    });

    it("uses custom aria-label when provided", () => {
      const onToggle = jest.fn();
      render(
        <MobileMenuToggle
          isOpen={false}
          onToggle={onToggle}
          ariaLabel="Custom menu toggle"
        />,
      );

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Custom menu toggle",
      );
    });

    it("sets aria-haspopup attribute", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-haspopup",
        "menu",
      );
    });
  });

  // ID handling tests
  describe("ID handling", () => {
    it("uses provided ID when specified", () => {
      const onToggle = jest.fn();
      render(
        <MobileMenuToggle
          isOpen={false}
          onToggle={onToggle}
          id="custom-toggle-id"
        />,
      );

      expect(screen.getByRole("button")).toHaveAttribute(
        "id",
        "custom-toggle-id",
      );
    });

    it("generates a unique ID when not provided", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button.id).toMatch(/^mobile-menu-toggle-/);
    });
  });

  // Styling tests
  describe("styling", () => {
    it("applies custom className when provided", () => {
      const onToggle = jest.fn();
      render(
        <MobileMenuToggle
          isOpen={false}
          onToggle={onToggle}
          className="custom-test-class"
        />,
      );

      expect(screen.getByRole("button")).toHaveClass("custom-test-class");
    });

    it("includes focus styles for accessibility", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:outline-none");
      expect(button).toHaveClass("focus:ring-2");
    });

    it("includes transition styles for smooth state changes", () => {
      const onToggle = jest.fn();
      render(<MobileMenuToggle isOpen={false} onToggle={onToggle} />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-colors");
    });
  });
});

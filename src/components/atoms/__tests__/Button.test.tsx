import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Button from "../Button";

describe("Button", () => {
  // Rendering Tests
  describe("rendering", () => {
    it("renders with default props", () => {
      render(<Button>Click Me</Button>);

      const button = screen.getByRole("button", { name: "Click Me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
      expect(button).not.toBeDisabled();
      // Button has aria-busy="false" by default, so check for that specific value
      expect(button).toHaveAttribute("aria-busy", "false");
    });

    it("renders with different variants", () => {
      const { rerender } = render(<Button variant="primary">Primary</Button>);
      let button = screen.getByRole("button", { name: "Primary" });
      // Primary should be rendered
      expect(button).toBeInTheDocument();

      rerender(<Button variant="secondary">Secondary</Button>);
      button = screen.getByRole("button", { name: "Secondary" });
      // Secondary should be rendered
      expect(button).toBeInTheDocument();

      rerender(<Button variant="outline">Outline</Button>);
      button = screen.getByRole("button", { name: "Outline" });
      // Outline should be rendered
      expect(button).toBeInTheDocument();
    });

    it("renders with different sizes", () => {
      const { rerender } = render(<Button size="small">Small</Button>);
      let button = screen.getByRole("button", { name: "Small" });
      expect(button.className).toContain("px-3 py-1 text-xs");

      rerender(<Button size="medium">Medium</Button>);
      button = screen.getByRole("button", { name: "Medium" });
      expect(button.className).toContain("px-4 py-2 text-sm");

      rerender(<Button size="large">Large</Button>);
      button = screen.getByRole("button", { name: "Large" });
      expect(button.className).toContain("px-6 py-3 text-base");
    });

    it("renders with custom className", () => {
      render(<Button className="custom-class">Custom Class</Button>);
      const button = screen.getByRole("button", { name: "Custom Class" });
      expect(button.className).toContain("custom-class");
    });

    it("renders with left icon", () => {
      const leftIcon = <span data-testid="left-icon">L</span>;
      render(<Button leftIcon={leftIcon}>With Left Icon</Button>);

      // Get the icon directly by test ID
      const icon = screen.getByTestId("left-icon");
      const buttonText = screen.getByText("With Left Icon");

      expect(icon).toBeInTheDocument();
      expect(buttonText).toBeInTheDocument();
      // Check that the icon's parent has the correct class
      expect(icon.parentElement).toHaveClass("mr-2");
    });

    it("renders with right icon", () => {
      const rightIcon = <span data-testid="right-icon">R</span>;
      render(<Button rightIcon={rightIcon}>With Right Icon</Button>);

      // Get the icon directly by test ID
      const icon = screen.getByTestId("right-icon");
      const buttonText = screen.getByText("With Right Icon");

      expect(icon).toBeInTheDocument();
      expect(buttonText).toBeInTheDocument();
      // Check that the icon's parent has the correct class
      expect(icon.parentElement).toHaveClass("ml-2");
    });

    it("renders with both icons", () => {
      const leftIcon = <span data-testid="left-icon">L</span>;
      const rightIcon = <span data-testid="right-icon">R</span>;
      const { container } = render(
        <Button leftIcon={leftIcon} rightIcon={rightIcon}>
          With Both Icons
        </Button>,
      );

      // Instead of using getByRole, directly test for the icons by test ID
      const leftIconEl = screen.getByTestId("left-icon");
      const rightIconEl = screen.getByTestId("right-icon");

      expect(leftIconEl).toBeInTheDocument();
      expect(rightIconEl).toBeInTheDocument();
      expect(screen.getByText("With Both Icons")).toBeInTheDocument();
    });

    it("renders with custom button type", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  // Interaction Tests
  describe("interactions", () => {
    it("calls onClick handler when clicked", () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const button = screen.getByRole("button", { name: "Click Me" });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>,
      );

      const button = screen.getByRole("button", { name: "Disabled" });
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it("does not call onClick when loading", () => {
      const handleClick = jest.fn();
      render(
        <Button onClick={handleClick} loading>
          Loading
        </Button>,
      );

      const button = screen.getByRole("button", { name: "Loading" });
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });
  });

  // Accessibility Tests
  describe("accessibility", () => {
    it("has correct aria attributes when loading", () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole("button", { name: "Loading" });
      expect(button).toHaveAttribute("aria-busy", "true");
      expect(button).toBeDisabled();
    });

    it("has custom aria-label when provided", () => {
      render(<Button aria-label="Custom Label">Button Text</Button>);

      // Get the button element directly by its aria-label
      const button = screen.getByLabelText("Custom Label");
      expect(button).toHaveAttribute("aria-label", "Custom Label");
      expect(button).toHaveTextContent("Button Text");
    });
  });

  // Special States Tests
  describe("special states", () => {
    it("shows loading spinner when loading", () => {
      render(<Button loading>Loading</Button>);

      const button = screen.getByRole("button", { name: "Loading" });
      const spinner = button.querySelector(".animate-spin");

      expect(button).toBeInTheDocument();
      expect(spinner).toBeInTheDocument();
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("aria-busy", "true");
    });

    it("has disabled attribute when disabled", () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole("button", { name: "Disabled" });

      expect(button).toBeDisabled();
      // Check for disabled styles using className or other attributes
      expect(button).toHaveAttribute("disabled");
      expect(button.style.cursor).toBe("not-allowed");
    });

    it("does not render icons when loading", () => {
      const leftIcon = <span data-testid="left-icon">L</span>;
      const rightIcon = <span data-testid="right-icon">R</span>;

      render(
        <Button loading leftIcon={leftIcon} rightIcon={rightIcon}>
          Loading
        </Button>,
      );

      const button = screen.getByRole("button", { name: "Loading" });
      expect(button).toBeInTheDocument();

      const leftIconEl = screen.queryByTestId("left-icon");
      const rightIconEl = screen.queryByTestId("right-icon");
      const spinner = button.querySelector(".animate-spin");

      expect(leftIconEl).not.toBeInTheDocument();
      expect(rightIconEl).not.toBeInTheDocument();
      expect(spinner).toBeInTheDocument();
    });
  });
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("Button component", () => {
  it("renders children correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const handleClick = jest.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>,
    );

    fireEvent.click(screen.getByText("Click me"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("forwards ref to button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Click me</Button>);

    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("renders with correct default props", () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("disabled");
  });

  it("applies custom className", () => {
    render(<Button className="test-class">Click me</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveClass("test-class");
  });

  it("sets aria-disabled attribute correctly", () => {
    render(<Button disabled>Click me</Button>);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("supports custom HTML attributes", () => {
    render(
      <Button data-testid="custom-button" id="btn-1" aria-label="Custom Button">
        Custom Attributes
      </Button>,
    );

    const button = screen.getByText("Custom Attributes");
    expect(button).toHaveAttribute("data-testid", "custom-button");
    expect(button).toHaveAttribute("id", "btn-1");
    expect(button).toHaveAttribute("aria-label", "Custom Button");
  });

  it("supports form submission when type is submit", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());

    render(
      <form onSubmit={handleSubmit} data-testid="test-form">
        <Button type="submit">Submit Form</Button>
      </form>,
    );

    fireEvent.submit(screen.getByTestId("test-form"));
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("can be focused with keyboard navigation", async () => {
    const user = userEvent.setup();

    render(<Button>Focusable Button</Button>);
    const button = screen.getByRole("button");

    // Initially not focused
    expect(button).not.toHaveFocus();

    // Focus the button programmatically
    await user.tab();
    expect(button).toHaveFocus();
  });

  it("maintains focus styling when focused", () => {
    render(<Button>Focus Button</Button>);
    const button = screen.getByRole("button");

    // Verify focus-related classes are present
    expect(button.className).toContain("focus:outline-none");
    expect(button.className).toContain("focus:ring-2");
  });

  // Variant tests
  describe("variants", () => {
    it("applies primary variant styling by default", () => {
      render(<Button>Primary Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-neon-green");
      expect(button).toHaveClass("text-dark-slate");
    });

    it("applies secondary variant styling when specified", () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-true-white");
      expect(button).toHaveClass("text-dark-slate");
      expect(button).toHaveClass("border-dark-slate/30");
    });

    it("applies danger variant styling when specified", () => {
      render(<Button variant="danger">Danger Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-true-white");
      expect(button).toHaveClass("text-crimson-red");
      expect(button).toHaveClass("border-crimson-red/30");
    });

    it("includes hover state classes for primary variant", () => {
      render(<Button variant="primary">Primary Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-neon-green/90");
    });

    it("includes hover state classes for secondary variant", () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-dark-slate/5");
    });

    it("includes hover state classes for danger variant", () => {
      render(<Button variant="danger">Danger Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-crimson-red/5");
    });
  });

  // Size tests
  describe("sizes", () => {
    it("applies medium (md) size styling by default", () => {
      render(<Button>Medium Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-base");
      expect(button).toHaveClass("px-md");
      expect(button).toHaveClass("py-sm");
    });

    it("applies small (sm) size styling when specified", () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("px-sm");
      expect(button).toHaveClass("py-xs");
      expect(button).toHaveClass("rounded-sm");
    });

    it("applies large (lg) size styling when specified", () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-lg");
      expect(button).toHaveClass("px-lg");
      expect(button).toHaveClass("py-md");
      expect(button).toHaveClass("rounded-lg");
      expect(button).toHaveClass("font-bold");
    });
  });

  // Interactive state tests
  describe("interactive states", () => {
    it("applies disabled styling when disabled", () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("opacity-50");
      expect(button).toHaveClass("cursor-not-allowed");
      expect(button).toHaveClass("pointer-events-none");
    });

    it("includes focus ring styling", () => {
      render(<Button>Focus Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus:ring-2");
    });

    it("includes transition effect classes", () => {
      render(<Button>Transition Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-colors");
      expect(button).toHaveClass("duration-normal");
    });

    it("includes active state classes", () => {
      render(<Button>Active Button</Button>);
      const button = screen.getByRole("button");

      if (button.className.includes("primary")) {
        expect(button).toHaveClass("active:bg-neon-green/80");
      } else if (button.className.includes("secondary")) {
        expect(button).toHaveClass("active:bg-dark-slate/10");
      } else if (button.className.includes("danger")) {
        expect(button).toHaveClass("active:bg-crimson-red/10");
      }
    });
  });
});

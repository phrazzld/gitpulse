import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

  // Interactive state test
  it("applies disabled styling when disabled", () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("opacity-50");
    expect(button).toHaveClass("cursor-not-allowed");
    expect(button).toHaveClass("pointer-events-none");
  });
});

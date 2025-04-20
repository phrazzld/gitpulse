import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ActionButton from "../ActionButton";

describe("ActionButton", () => {
  test("renders correctly in default state", () => {
    render(<ActionButton loading={false} />);
    expect(screen.getByText("ANALYZE COMMITS")).toBeInTheDocument();

    // Check if the button is enabled
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();

    // Verify default state styling
    expect(button).toHaveClass("bg-dark-slate");
    expect(button).toHaveClass("text-neon-green");
  });

  test("renders correctly in loading state", () => {
    render(<ActionButton loading={true} />);

    // Check loading indicator and text
    expect(screen.getByText("ANALYZING DATA...")).toBeInTheDocument();
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    // Check for loading state styles
    expect(button).toHaveClass("opacity-70");
    expect(button).toHaveClass("cursor-not-allowed");

    // Check if spinner element exists
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  test("changes appearance on mouse enter and leave", () => {
    render(<ActionButton loading={false} />);
    const button = screen.getByRole("button");

    // Initially bg-dark-slate
    expect(button).toHaveClass("bg-dark-slate");
    expect(button).toHaveClass("text-neon-green");

    // Fire mouse enter event
    fireEvent.mouseEnter(button);

    // Should change to bg-neon-green
    expect(button).toHaveClass("bg-neon-green");
    expect(button).toHaveClass("text-dark-slate");
    expect(button).toHaveClass("shadow-[0_0_15px_rgba(0,255,135,0.4)]");

    // Fire mouse leave event
    fireEvent.mouseLeave(button);

    // Should revert to original state
    expect(button).toHaveClass("bg-dark-slate");
    expect(button).toHaveClass("text-neon-green");
    expect(button).toHaveClass("shadow-[0_0_10px_rgba(0,255,135,0.2)]");
  });

  test("hover state doesn't change when loading", () => {
    render(<ActionButton loading={true} />);
    const button = screen.getByRole("button");

    // Check initial loading state
    expect(button).toHaveClass("opacity-70");
    expect(button).toHaveClass("cursor-not-allowed");

    // Hover should have no effect in loading state
    fireEvent.mouseEnter(button);
    expect(button).not.toHaveClass("bg-neon-green");
    expect(button).not.toHaveClass("text-dark-slate");

    // Leave should also have no effect in loading state
    fireEvent.mouseLeave(button);
    expect(button).toHaveClass("opacity-70");
    expect(button).toHaveClass("cursor-not-allowed");
  });

  test("handles different loading states", () => {
    // Test loading state true
    const { rerender } = render(<ActionButton loading={true} />);

    // Check disabled attribute in loading state
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText("ANALYZING DATA...")).toBeInTheDocument();

    // Test loading state false
    rerender(<ActionButton loading={false} />);

    // Check enabled state
    expect(screen.getByRole("button")).not.toBeDisabled();
    expect(screen.getByText("ANALYZE COMMITS")).toBeInTheDocument();
  });

  test("renders with submit type for form submission", () => {
    render(<ActionButton loading={false} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "submit");
  });

  test("renders with proper tooltip", () => {
    render(<ActionButton loading={false} />);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute(
      "title",
      "Analyze your GitHub commits and generate activity summary with AI insights",
    );
  });

  test("renders SVG icons in non-loading state", () => {
    render(<ActionButton loading={false} />);
    const svgs = document.querySelectorAll("svg");
    expect(svgs.length).toBe(2); // Should render 2 SVG icons
  });
});

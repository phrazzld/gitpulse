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
  });

  test("renders correctly in loading state", () => {
    render(<ActionButton loading={true} />);

    // Check loading indicator and text
    expect(screen.getByText("ANALYZING DATA...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();

    // Check if spinner element exists
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  test("handles mouse over and mouse out events with React events", () => {
    render(<ActionButton loading={false} />);
    const button = screen.getByRole("button");

    // Verify presence of mouse event handlers
    expect(button.onmouseover).toBeDefined();
    expect(button.onmouseout).toBeDefined();

    // Click event
    fireEvent.click(button);
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

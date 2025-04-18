import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../Input";

describe("Input component", () => {
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).not.toHaveAttribute("disabled");
  });

  it("handles value changes", () => {
    const handleChange = jest.fn();
    render(<Input value="test" onChange={handleChange} />);

    const input = screen.getByDisplayValue("test");
    fireEvent.change(input, { target: { value: "updated" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("applies disabled state correctly", () => {
    render(<Input disabled placeholder="Disabled input" />);

    const input = screen.getByPlaceholderText("Disabled input");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-disabled", "true");
    expect(input).toHaveClass("opacity-50");
    expect(input).toHaveClass("cursor-not-allowed");
  });

  it("applies error state correctly", () => {
    render(<Input error placeholder="Error input" />);

    const input = screen.getByPlaceholderText("Error input");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-crimson-red");
  });

  it("forwards ref to input element", () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("applies custom className", () => {
    render(<Input className="test-class" />);

    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("test-class");
  });

  it("accepts different input types", () => {
    render(<Input type="password" placeholder="Password" />);

    const input = screen.getByPlaceholderText("Password");
    expect(input).toHaveAttribute("type", "password");
  });

  it("supports aria-label", () => {
    render(<Input ariaLabel="Custom label" />);

    const input = screen.getByLabelText("Custom label");
    expect(input).toBeInTheDocument();
  });
});

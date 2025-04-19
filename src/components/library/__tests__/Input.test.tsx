import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "../Input";

describe("Input component", () => {
  // Base functionality tests
  it("renders with default props", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).not.toHaveAttribute("disabled");
  });

  it("generates unique IDs for inputs when id not provided", () => {
    render(
      <>
        <Input placeholder="First input" />
        <Input placeholder="Second input" />
      </>,
    );

    const firstInput = screen.getByPlaceholderText("First input");
    const secondInput = screen.getByPlaceholderText("Second input");

    expect(firstInput.id).not.toBe("");
    expect(secondInput.id).not.toBe("");
    expect(firstInput.id).not.toBe(secondInput.id);
  });

  it("handles value changes", () => {
    const handleChange = jest.fn();
    render(<Input value="test" onChange={handleChange} />);

    const input = screen.getByDisplayValue("test");
    fireEvent.change(input, { target: { value: "updated" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
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

  it("supports additional HTML attributes", () => {
    render(
      <Input
        placeholder="Custom attributes"
        maxLength={10}
        min={5}
        max={100}
        autoComplete="off"
        data-testid="custom-input"
      />,
    );

    const input = screen.getByPlaceholderText("Custom attributes");
    expect(input).toHaveAttribute("maxlength", "10");
    expect(input).toHaveAttribute("min", "5");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("autocomplete", "off");
    expect(input).toHaveAttribute("data-testid", "custom-input");
  });

  // State tests
  describe("states", () => {
    it("applies disabled state correctly", () => {
      render(<Input disabled placeholder="Disabled input" />);

      const input = screen.getByPlaceholderText("Disabled input");
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute("aria-disabled", "true");
      expect(input.className).toContain("disabled:opacity-50");
      expect(input.className).toContain("disabled:cursor-not-allowed");
    });

    it("applies error state correctly", () => {
      render(<Input error placeholder="Error input" />);

      const input = screen.getByPlaceholderText("Error input");
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input).toHaveClass("border-crimson-red");
    });

    it("handles boolean true and string error values the same way", () => {
      render(
        <>
          <Input error={true} placeholder="Boolean error" />
          <Input
            error="Error message without display"
            placeholder="String error"
          />
        </>,
      );

      const booleanError = screen.getByPlaceholderText("Boolean error");
      const stringError = screen.getByPlaceholderText("String error");

      expect(booleanError).toHaveAttribute("aria-invalid", "true");
      expect(stringError).toHaveAttribute("aria-invalid", "true");
      expect(booleanError).toHaveClass("border-crimson-red");
      expect(stringError).toHaveClass("border-crimson-red");
    });

    it("displays error message when provided", () => {
      render(
        <Input
          error
          errorMessage="This field is required"
          placeholder="Error input with message"
        />,
      );

      const errorMessage = screen.getByText("This field is required");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass("text-crimson-red");
    });

    it("applies readonly state correctly", () => {
      render(<Input readOnly value="Read-only value" />);

      const input = screen.getByDisplayValue("Read-only value");
      expect(input).toHaveAttribute("readonly");
      expect(input).toHaveAttribute("aria-readonly", "true");
      expect(input).toHaveClass("cursor-default");
    });
  });

  // Variant tests
  describe("variants", () => {
    it("applies outlined variant styling by default", () => {
      render(<Input placeholder="Outlined input" />);

      const input = screen.getByPlaceholderText("Outlined input");
      expect(input).toHaveClass("bg-true-white");
      expect(input).toHaveClass("border-dark-slate/30");
    });

    it("applies filled variant styling when specified", () => {
      render(<Input variant="filled" placeholder="Filled input" />);

      const input = screen.getByPlaceholderText("Filled input");
      expect(input).toHaveClass("bg-dark-slate/5");
      expect(input).toHaveClass("border-transparent");
    });
  });

  // Size tests
  describe("sizes", () => {
    it("applies medium (md) size styling by default", () => {
      render(<Input placeholder="Medium input" />);

      const input = screen.getByPlaceholderText("Medium input");
      expect(input).toHaveClass("text-base");
      expect(input).toHaveClass("px-md");
      expect(input).toHaveClass("py-sm");
    });

    it("applies small (sm) size styling when specified", () => {
      render(<Input size="sm" placeholder="Small input" />);

      const input = screen.getByPlaceholderText("Small input");
      expect(input).toHaveClass("text-sm");
      expect(input).toHaveClass("px-sm");
      expect(input).toHaveClass("py-xs");
      expect(input).toHaveClass("rounded-sm");
    });

    it("applies large (lg) size styling when specified", () => {
      render(<Input size="lg" placeholder="Large input" />);

      const input = screen.getByPlaceholderText("Large input");
      expect(input).toHaveClass("text-lg");
      expect(input).toHaveClass("px-lg");
      expect(input).toHaveClass("py-md");
      expect(input).toHaveClass("rounded-lg");
    });
  });

  // Input type tests
  describe("input types", () => {
    it("renders text input by default", () => {
      render(<Input placeholder="Text input" />);

      const input = screen.getByPlaceholderText("Text input");
      expect(input).toHaveAttribute("type", "text");
    });

    it("supports HTML size attribute", () => {
      render(<Input htmlSize={10} placeholder="With HTML size" />);

      const input = screen.getByPlaceholderText("With HTML size");
      expect(input).toHaveAttribute("size", "10");
    });

    it("renders password input with appropriate styling", () => {
      render(<Input type="password" placeholder="Password" />);

      const input = screen.getByPlaceholderText("Password");
      expect(input).toHaveAttribute("type", "password");
      expect(input).toHaveClass("font-mono");
      expect(input).toHaveClass("tracking-wider");
    });

    it("renders email input correctly", () => {
      render(<Input type="email" placeholder="Email" />);

      const input = screen.getByPlaceholderText("Email");
      expect(input).toHaveAttribute("type", "email");
    });

    it("renders number input with appropriate styling", () => {
      render(<Input type="number" placeholder="Number" />);

      const input = screen.getByPlaceholderText("Number");
      expect(input).toHaveAttribute("type", "number");
      expect(input).toHaveClass("font-mono");
    });

    it("renders search input with appropriate styling", () => {
      render(<Input type="search" placeholder="Search" />);

      const input = screen.getByPlaceholderText("Search");
      expect(input).toHaveAttribute("type", "search");
      expect(input).toHaveClass("pr-8");
    });

    it("renders date input with appropriate styling", () => {
      render(<Input type="date" placeholder="Date" />);

      const input = screen.getByPlaceholderText("Date");
      expect(input).toHaveAttribute("type", "date");
      expect(input).toHaveClass("font-mono");
    });
  });

  // Accessibility tests
  describe("accessibility", () => {
    it("supports aria-label", () => {
      render(<Input ariaLabel="Custom label" />);

      const input = screen.getByLabelText("Custom label");
      expect(input).toBeInTheDocument();
    });

    it("associates error message with input using aria-describedby", () => {
      render(
        <Input
          error
          errorMessage="Error description"
          placeholder="Input with error"
          id="test-input"
        />,
      );

      const input = screen.getByPlaceholderText("Input with error");
      const errorId = input.getAttribute("aria-describedby");
      const errorMessage = screen.getByText("Error description");

      expect(errorId).toBeDefined();
      expect(errorMessage.id).toEqual(errorId);
    });

    it("supports custom aria-describedby", () => {
      render(
        <Input
          ariaDescribedby="custom-description"
          placeholder="Input with description"
        />,
      );

      const input = screen.getByPlaceholderText("Input with description");
      expect(input).toHaveAttribute("aria-describedby", "custom-description");
    });
  });
});

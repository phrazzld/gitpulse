import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Card, Input } from "../";

describe("Component composition", () => {
  // Button inside Card tests
  describe("Button inside Card", () => {
    it("renders button correctly inside card", () => {
      render(
        <Card data-testid="card">
          <Button data-testid="button">Click me</Button>
        </Card>,
      );

      const card = screen.getByTestId("card");
      const button = screen.getByTestId("button");

      expect(card).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(card).toContainElement(button);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("maintains button styling when inside card", () => {
      render(
        <Card>
          <Button data-testid="test-button">Click me</Button>
        </Card>,
      );

      const button = screen.getByTestId("test-button");

      // Button should maintain its styling
      expect(button).toHaveClass("bg-neon-green"); // Default primary styling
      expect(button).toHaveClass("text-dark-slate");
      expect(button).toHaveClass("inline-flex");
    });

    it("handles button click events when inside card", () => {
      const handleClick = jest.fn();

      render(
        <Card>
          <Button onClick={handleClick}>Click me</Button>
        </Card>,
      );

      fireEvent.click(screen.getByText("Click me"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("applies variant styling properly when nested", () => {
      render(
        <Card shadow="lg">
          <Button variant="secondary" data-testid="secondary-button">
            Secondary
          </Button>
          <Button variant="danger" data-testid="danger-button">
            Danger
          </Button>
        </Card>,
      );

      const secondaryButton = screen.getByTestId("secondary-button");
      const dangerButton = screen.getByTestId("danger-button");
      const card = secondaryButton.parentElement;

      // Card should have large shadow
      expect(card).toHaveClass("shadow-lg");

      // Buttons should maintain their variant styles
      expect(secondaryButton).toHaveClass("text-dark-slate");
      expect(secondaryButton).toHaveClass("border-dark-slate/30");
      expect(dangerButton).toHaveClass("text-crimson-red");
      expect(dangerButton).toHaveClass("border-crimson-red/30");
    });
  });

  // Input inside Card tests
  describe("Input inside Card", () => {
    it("renders input correctly inside card", () => {
      render(
        <Card data-testid="card">
          <Input data-testid="input" placeholder="Enter text" />
        </Card>,
      );

      const card = screen.getByTestId("card");
      const input = screen.getByTestId("input");

      expect(card).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(card).toContainElement(input.closest("div"));
      expect(input).toHaveAttribute("placeholder", "Enter text");
    });

    it("maintains input styling when inside card", () => {
      render(
        <Card>
          <Input data-testid="test-input" />
        </Card>,
      );

      const input = screen.getByTestId("test-input");

      // Input should maintain its styling
      expect(input).toHaveClass("bg-true-white"); // Default outlined styling
      expect(input).toHaveClass("border-dark-slate/30");
    });

    it("handles input change events when inside card", () => {
      const handleChange = jest.fn();

      render(
        <Card>
          <Input onChange={handleChange} data-testid="test-input" />
        </Card>,
      );

      const input = screen.getByTestId("test-input");
      fireEvent.change(input, { target: { value: "Test input" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it("shows error state correctly when inside card", () => {
      render(
        <Card>
          <Input
            data-testid="error-input"
            error={true}
            errorMessage="This field is required"
          />
        </Card>,
      );

      const input = screen.getByTestId("error-input");
      const errorMessage = screen.getByText("This field is required");

      expect(input).toHaveClass("border-crimson-red");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass("text-crimson-red");
    });
  });

  // Complex composition tests
  describe("Complex component compositions", () => {
    it("renders multiple components inside a card with correct layout", () => {
      render(
        <Card data-testid="outer-card">
          <h2>Form Title</h2>
          <Input data-testid="name-input" placeholder="Name" />
          <Input data-testid="email-input" placeholder="Email" type="email" />
          <div className="button-group">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Submit</Button>
          </div>
        </Card>,
      );

      const card = screen.getByTestId("outer-card");
      const nameInput = screen.getByTestId("name-input");
      const emailInput = screen.getByTestId("email-input");
      const cancelButton = screen.getByText("Cancel");
      const submitButton = screen.getByText("Submit");

      expect(card).toBeInTheDocument();
      expect(screen.getByText("Form Title")).toBeInTheDocument();
      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();

      // Email input should have the correct type
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("supports nested cards with proper styling isolation", () => {
      render(
        <Card data-testid="outer-card" padding="lg" shadow="sm">
          <h2>Outer Card</h2>
          <Card data-testid="inner-card" padding="sm" shadow="none">
            <p>Inner Card Content</p>
            <Button>Inner Button</Button>
          </Card>
        </Card>,
      );

      const outerCard = screen.getByTestId("outer-card");
      const innerCard = screen.getByTestId("inner-card");

      // Outer card should have its own styling
      expect(outerCard).toHaveClass("p-lg");
      expect(outerCard).toHaveClass("shadow-sm");

      // Inner card should have its own styling
      expect(innerCard).toHaveClass("p-sm");
      expect(innerCard).toHaveClass("shadow-none");

      // Inner content should be rendered
      expect(screen.getByText("Inner Card Content")).toBeInTheDocument();
      expect(screen.getByText("Inner Button")).toBeInTheDocument();
    });

    it("maintains event handling in deeply nested components", () => {
      const outerButtonClick = jest.fn();
      const innerButtonClick = jest.fn();

      render(
        <Card data-testid="outer-card">
          <Button onClick={outerButtonClick}>Outer Button</Button>
          <Card data-testid="inner-card">
            <Button onClick={innerButtonClick}>Inner Button</Button>
          </Card>
        </Card>,
      );

      fireEvent.click(screen.getByText("Outer Button"));
      fireEvent.click(screen.getByText("Inner Button"));

      expect(outerButtonClick).toHaveBeenCalledTimes(1);
      expect(innerButtonClick).toHaveBeenCalledTimes(1);
    });

    it("applies custom classes to nested components without conflicts", () => {
      render(
        <Card className="outer-custom" data-testid="outer-card">
          <Button className="button-custom" data-testid="custom-button">
            Custom Button
          </Button>
          <Input className="input-custom" data-testid="custom-input" />
        </Card>,
      );

      const outerCard = screen.getByTestId("outer-card");
      const button = screen.getByTestId("custom-button");
      const input = screen.getByTestId("custom-input");

      expect(outerCard).toHaveClass("outer-custom");
      expect(button).toHaveClass("button-custom");
      expect(input).toHaveClass("input-custom");
    });
  });

  // Keyboard navigation and accessibility tests
  describe("Keyboard navigation and accessibility", () => {
    it("maintains focus order across nested components", async () => {
      const user = userEvent.setup();

      render(
        <Card>
          <Button data-testid="button-1">First Button</Button>
          <Input data-testid="input-1" />
          <Card>
            <Button data-testid="button-2">Second Button</Button>
          </Card>
        </Card>,
      );

      const button1 = screen.getByTestId("button-1");
      const input1 = screen.getByTestId("input-1");
      const button2 = screen.getByTestId("button-2");

      // Initial focus state
      expect(button1).not.toHaveFocus();
      expect(input1).not.toHaveFocus();
      expect(button2).not.toHaveFocus();

      // Tab navigation
      await user.tab();
      expect(button1).toHaveFocus();

      await user.tab();
      expect(input1).toHaveFocus();

      await user.tab();
      expect(button2).toHaveFocus();
    });
  });
});

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Form } from "../Form";
import { z } from "zod";

describe("Form component", () => {
  it("should render children correctly", () => {
    render(
      <Form onSubmit={jest.fn()}>
        <div data-testid="child-element">Form Child</div>
      </Form>,
    );

    expect(screen.getByTestId("child-element")).toBeInTheDocument();
  });

  it("should call onSubmit handler with form values when form is submitted", () => {
    const handleSubmit = jest.fn();

    render(
      <Form onSubmit={handleSubmit}>
        <input
          name="username"
          defaultValue="testuser"
          data-testid="username-input"
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </Form>,
    );

    fireEvent.click(screen.getByTestId("submit-button"));

    expect(handleSubmit).toHaveBeenCalledWith({
      username: "testuser",
    });
  });

  it("should validate form data with schema before submission", () => {
    const handleSubmit = jest.fn();
    const schema = z.object({
      username: z.string().min(5, "Username must be at least 5 characters"),
      email: z.string().email("Invalid email address"),
    });

    render(
      <Form onSubmit={handleSubmit} schema={schema}>
        <input
          name="username"
          defaultValue="test"
          data-testid="username-input"
        />
        <input name="email" defaultValue="invalid" data-testid="email-input" />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </Form>,
    );

    fireEvent.click(screen.getByTestId("submit-button"));

    // Form submission should be blocked due to validation errors
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("should submit form when validation passes", () => {
    const handleSubmit = jest.fn();
    const schema = z.object({
      username: z.string().min(5, "Username must be at least 5 characters"),
      email: z.string().email("Invalid email address"),
    });

    render(
      <Form onSubmit={handleSubmit} schema={schema}>
        <input
          name="username"
          defaultValue="validuser"
          data-testid="username-input"
        />
        <input
          name="email"
          defaultValue="test@example.com"
          data-testid="email-input"
        />
        <button type="submit" data-testid="submit-button">
          Submit
        </button>
      </Form>,
    );

    fireEvent.click(screen.getByTestId("submit-button"));

    // Form submission should proceed when validation passes
    expect(handleSubmit).toHaveBeenCalledWith({
      username: "validuser",
      email: "test@example.com",
    });
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card component", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <p>Test content</p>
      </Card>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <Card className="test-class">
        <p>Test content</p>
      </Card>,
    );

    const card = screen.getByText("Test content").parentElement;
    expect(card).toHaveClass("test-class");
  });

  it("forwards ref to div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Card ref={ref}>
        <p>Test content</p>
      </Card>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it("renders with default props", () => {
    render(
      <Card data-testid="default-card">
        <p>Test content</p>
      </Card>,
    );

    const card = screen.getByTestId("default-card");
    expect(card).toHaveClass("p-md");
    expect(card).toHaveClass("rounded");
    expect(card).toHaveClass("shadow");
  });

  describe("padding variants", () => {
    it("applies no padding when specified", () => {
      render(
        <Card padding="none" data-testid="no-padding">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("no-padding");
      expect(card).toHaveClass("p-0");
    });

    it("applies small padding when specified", () => {
      render(
        <Card padding="sm" data-testid="small-padding">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("small-padding");
      expect(card).toHaveClass("p-sm");
    });

    it("applies large padding when specified", () => {
      render(
        <Card padding="lg" data-testid="large-padding">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("large-padding");
      expect(card).toHaveClass("p-lg");
    });
  });

  describe("radius variants", () => {
    it("applies no border radius when specified", () => {
      render(
        <Card radius="none" data-testid="no-radius">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("no-radius");
      expect(card).toHaveClass("rounded-none");
    });

    it("applies small border radius when specified", () => {
      render(
        <Card radius="sm" data-testid="small-radius">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("small-radius");
      expect(card).toHaveClass("rounded-sm");
    });

    it("applies large border radius when specified", () => {
      render(
        <Card radius="lg" data-testid="large-radius">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("large-radius");
      expect(card).toHaveClass("rounded-lg");
    });
  });

  describe("shadow variants", () => {
    it("applies no shadow when specified", () => {
      render(
        <Card shadow="none" data-testid="no-shadow">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("no-shadow");
      expect(card).toHaveClass("shadow-none");
    });

    it("applies small shadow when specified", () => {
      render(
        <Card shadow="sm" data-testid="small-shadow">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("small-shadow");
      expect(card).toHaveClass("shadow-sm");
    });

    it("applies large shadow when specified", () => {
      render(
        <Card shadow="lg" data-testid="large-shadow">
          <p>Test content</p>
        </Card>,
      );

      const card = screen.getByTestId("large-shadow");
      expect(card).toHaveClass("shadow-lg");
    });
  });

  it("applies HTML attributes correctly", () => {
    render(
      <Card
        data-testid="html-attrs"
        aria-label="Card example"
        role="region"
        id="test-card"
      >
        <p>Test content</p>
      </Card>,
    );

    const card = screen.getByTestId("html-attrs");
    expect(card).toHaveAttribute("aria-label", "Card example");
    expect(card).toHaveAttribute("role", "region");
    expect(card).toHaveAttribute("id", "test-card");
  });
});

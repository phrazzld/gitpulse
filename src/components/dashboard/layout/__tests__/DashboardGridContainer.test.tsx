import React from "react";
import { render, screen } from "@testing-library/react";
import { DashboardGridContainer } from "../DashboardGridContainer";

describe("DashboardGridContainer component", () => {
  it("renders children correctly", () => {
    render(
      <DashboardGridContainer>
        <div data-testid="child-element">Test content</div>
      </DashboardGridContainer>,
    );

    expect(screen.getByTestId("child-element")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("applies grid classes by default", () => {
    render(
      <DashboardGridContainer data-testid="grid-container">
        <div>Child element</div>
      </DashboardGridContainer>,
    );

    const container = screen.getByTestId("grid-container");
    expect(container).toHaveClass("grid");
    expect(container).toHaveClass("w-full");
    expect(container).toHaveClass("grid-cols-12");
    expect(container).toHaveClass("gap-md");
  });

  it("applies custom className", () => {
    render(
      <DashboardGridContainer
        className="test-class"
        data-testid="grid-container"
      >
        <div>Child element</div>
      </DashboardGridContainer>,
    );

    const container = screen.getByTestId("grid-container");
    expect(container).toHaveClass("test-class");
  });

  it("forwards ref to div element", () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <DashboardGridContainer ref={ref}>
        <div>Test content</div>
      </DashboardGridContainer>,
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  describe("columns prop", () => {
    it("applies custom number of columns", () => {
      render(
        <DashboardGridContainer columns={24} data-testid="custom-columns">
          <div>Child element</div>
        </DashboardGridContainer>,
      );

      const container = screen.getByTestId("custom-columns");
      expect(container).toHaveClass("grid-cols-24");
    });
  });

  describe("gap variants", () => {
    it("applies small gap when specified", () => {
      render(
        <DashboardGridContainer gap="sm" data-testid="small-gap">
          <div>Child element</div>
        </DashboardGridContainer>,
      );

      const container = screen.getByTestId("small-gap");
      expect(container).toHaveClass("gap-sm");
    });

    it("applies medium gap by default", () => {
      render(
        <DashboardGridContainer data-testid="medium-gap">
          <div>Child element</div>
        </DashboardGridContainer>,
      );

      const container = screen.getByTestId("medium-gap");
      expect(container).toHaveClass("gap-md");
    });

    it("applies large gap when specified", () => {
      render(
        <DashboardGridContainer gap="lg" data-testid="large-gap">
          <div>Child element</div>
        </DashboardGridContainer>,
      );

      const container = screen.getByTestId("large-gap");
      expect(container).toHaveClass("gap-lg");
    });
  });

  it("applies HTML attributes correctly", () => {
    render(
      <DashboardGridContainer
        data-testid="html-attrs"
        aria-label="Grid container"
        role="region"
        id="test-grid"
      >
        <div>Child element</div>
      </DashboardGridContainer>,
    );

    const container = screen.getByTestId("html-attrs");
    expect(container).toHaveAttribute("aria-label", "Grid container");
    expect(container).toHaveAttribute("role", "region");
    expect(container).toHaveAttribute("id", "test-grid");
  });
});

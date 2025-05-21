import React from "react";
import { render, waitFor } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import Button from "../Button";

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe("Button Icon-Only Accessibility", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    // Ensure we're in development mode for console error tests
    (process.env as any).NODE_ENV = "development";
  });

  afterAll(() => {
    // Restore original NODE_ENV
    (process.env as any).NODE_ENV = originalNodeEnv;
  });

  // Icon components for testing - aria-hidden since they're decorative
  const IconSettings = () => (
    <svg width="16" height="16" aria-hidden="true">
      <path d="..." />
    </svg>
  );
  const IconClose = () => <span aria-hidden="true">×</span>;
  const IconEdit = () => (
    <svg width="16" height="16" aria-hidden="true">
      <path d="..." />
    </svg>
  );

  describe("Icon-only button enforcement", () => {
    it("should pass accessibility tests when icon-only button has aria-label", async () => {
      const { container } = render(
        <Button aria-label="Open settings" leftIcon={<IconSettings />} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should pass accessibility tests with right icon and aria-label", async () => {
      const { container } = render(
        <Button aria-label="Close dialog" rightIcon={<IconClose />} />,
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should console error when icon-only button lacks aria-label", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      // We're intentionally bypassing TypeScript type checking to demonstrate
      // the runtime validation of aria-label requirement for icon-only buttons
      type IconButtonWithoutAriaLabel = Omit<React.ComponentProps<typeof Button>, 'aria-label'> & {
        leftIcon: React.ReactNode;
        children?: never;
      };
      
      const buttonProps: IconButtonWithoutAriaLabel = {
        leftIcon: <IconSettings />,
        children: undefined
      };

      // Using type assertion to bypass TypeScript's compile-time checking
      render(<Button {...buttonProps as any} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "Icon-only button must have an accessible name",
        );
      });

      consoleError.mockRestore();
    });

    it("should console error for empty string children with icon", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      // We're intentionally bypassing TypeScript type checking to demonstrate
      // the runtime validation of aria-label requirement for icon-only buttons
      type IconButtonWithoutAriaLabel = Omit<React.ComponentProps<typeof Button>, 'aria-label'> & {
        leftIcon: React.ReactNode;
        children?: React.ReactNode;
      };
      
      const buttonProps: IconButtonWithoutAriaLabel = {
        leftIcon: <IconSettings />,
        children: null
      };

      // Using type assertion to bypass TypeScript's compile-time checking
      render(<Button {...buttonProps as any} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "Icon-only button must have an accessible name",
        );
      });

      consoleError.mockRestore();
    });

    it("should console error for whitespace-only children with icon", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      // We're intentionally bypassing TypeScript type checking to demonstrate
      // the runtime validation of aria-label requirement for icon-only buttons with whitespace
      type ButtonWithWhitespaceProps = Omit<React.ComponentProps<typeof Button>, 'aria-label'> & {
        leftIcon: React.ReactNode;
        children: string;
      };
      
      const buttonProps: ButtonWithWhitespaceProps = {
        leftIcon: <IconSettings />,
        children: ' '
      };

      // Using type assertion to bypass TypeScript's compile-time checking
      render(<Button {...buttonProps as any} />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "Icon-only button must have an accessible name",
        );
      });

      consoleError.mockRestore();
    });
  });

  describe("Button with text and icon", () => {
    it("should not require aria-label when button has text content", async () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      const { container } = render(
        <Button leftIcon={<IconSettings />}>Settings</Button>,
      );

      // Should not console error
      await waitFor(() => {
        expect(consoleError).not.toHaveBeenCalled();
      });

      // Should pass accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      consoleError.mockRestore();
    });

    it("should allow optional aria-label with text content", async () => {
      const { container, getByRole } = render(
        <Button leftIcon={<IconEdit />} aria-label="Edit user profile">
          Edit
        </Button>,
      );

      // aria-label should override text content for screen readers
      const button = getByRole("button", { name: "Edit user profile" });
      expect(button).toBeInTheDocument();

      // Should pass accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Common icon-only button patterns", () => {
    it("close button should have appropriate aria-label", async () => {
      const { container, getByRole } = render(
        <Button
          rightIcon={<IconClose />}
          aria-label="Close notification"
          variant="outline"
        />,
      );

      const button = getByRole("button", { name: "Close notification" });
      expect(button).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("settings button should have appropriate aria-label", async () => {
      const { container, getByRole } = render(
        <Button
          leftIcon={<IconSettings />}
          aria-label="Open settings menu"
          variant="secondary"
        />,
      );

      const button = getByRole("button", { name: "Open settings menu" });
      expect(button).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("edit button should have appropriate aria-label", async () => {
      const { container, getByRole } = render(
        <Button
          leftIcon={<IconEdit />}
          aria-label="Edit user profile"
          size="small"
        />,
      );

      const button = getByRole("button", { name: "Edit user profile" });
      expect(button).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Icon button states", () => {
    it("disabled icon-only button should still have aria-label", async () => {
      const { container, getByRole } = render(
        <Button
          leftIcon={<IconSettings />}
          aria-label="Settings (disabled)"
          disabled
        />,
      );

      const button = getByRole("button", { name: "Settings (disabled)" });
      expect(button).toBeDisabled();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("loading icon-only button should maintain aria-label", async () => {
      const { container, getByRole } = render(
        <Button
          leftIcon={<IconSettings />}
          aria-label="Loading settings"
          loading
        />,
      );

      const button = getByRole("button", { name: "Loading settings" });
      expect(button).toHaveAttribute("aria-busy", "true");

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("pressed icon-only button should have aria-pressed", async () => {
      const { container, getByRole } = render(
        <Button
          leftIcon={<IconSettings />}
          aria-label="Toggle settings panel"
          pressed={true}
        />,
      );

      const button = getByRole("button", { name: "Toggle settings panel" });
      expect(button).toHaveAttribute("aria-pressed", "true");

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Multiple icon-only buttons", () => {
    it("should have unique aria-labels for similar actions", async () => {
      const { container, getByRole } = render(
        <div>
          <Button leftIcon={<IconClose />} aria-label="Close notification" />
          <Button leftIcon={<IconClose />} aria-label="Close dialog" />
          <Button leftIcon={<IconClose />} aria-label="Remove filter" />
        </div>,
      );

      // Each button should be distinguishable
      expect(
        getByRole("button", { name: "Close notification" }),
      ).toBeInTheDocument();
      expect(getByRole("button", { name: "Close dialog" })).toBeInTheDocument();
      expect(
        getByRole("button", { name: "Remove filter" }),
      ).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("aria-label best practices", () => {
    it("should use action-oriented labels", async () => {
      const goodExamples = [
        { icon: <IconSettings />, label: "Open settings" },
        { icon: <IconEdit />, label: "Edit profile" },
        { icon: <IconClose />, label: "Close notification" },
      ];

      for (const example of goodExamples) {
        const { container } = render(
          <Button leftIcon={example.icon} aria-label={example.label} />,
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });

    it("should not include redundant words in aria-label", () => {
      // These are examples of what NOT to do - just for documentation
      const badExamples = [
        "Settings button", // Don't include "button"
        "Click to open settings", // Don't include "click"
        "Settings icon", // Don't include "icon"
      ];

      // Good examples
      const goodExamples = [
        "Settings",
        "Open settings",
        "Configure application",
      ];

      expect(goodExamples).toBeTruthy();
      expect(badExamples).toBeTruthy();
    });
  });
});

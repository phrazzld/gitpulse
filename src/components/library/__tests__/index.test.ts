/**
 * Test file to verify that the barrel file exports work correctly
 */

import {
  Button,
  ButtonProps,
  Card,
  CardProps,
  Input,
  InputProps,
  cn,
} from "../";

// This test simply verifies that all exports are available
// We don't actually use them, just check that they can be imported
describe("Component library barrel file", () => {
  it("exports all components and interfaces", () => {
    // Check that exports are defined
    expect(Button).toBeDefined();
    expect(Card).toBeDefined();
    expect(Input).toBeDefined();
    expect(cn).toBeDefined();

    // Type checks (these are compile-time checks only)
    const _checkTypes = () => {
      // This function is never called, it just verifies types at compile time
      const _buttonProps: ButtonProps = { children: "Test" };
      const _cardProps: CardProps = { children: "Test" };
      const _inputProps: InputProps = { placeholder: "Test" };

      return { _buttonProps, _cardProps, _inputProps };
    };

    // We don't need to call the function, just check that it compiles
    expect(true).toBe(true);
  });
});

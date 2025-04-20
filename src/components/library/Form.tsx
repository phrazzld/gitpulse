import React, { FormEvent, ReactNode } from "react";
import { z } from "zod";

interface FormProps {
  children: ReactNode;
  onSubmit: (values: Record<string, string>) => void;
  className?: string;
  id?: string;
  schema?: z.ZodObject<z.ZodRawShape>;
  noValidate?: boolean;
}

/**
 * Form component with built-in validation
 *
 * This component handles form submission and validation using
 * an optional Zod schema. If no schema is provided, the form will
 * still collect values from all inputs but won't perform validation.
 */
export function Form({
  children,
  onSubmit,
  className = "",
  id,
  schema,
  noValidate = true,
}: FormProps) {
  // State for form validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Handle form submission
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Get form data
    const formData = new FormData(event.currentTarget);
    const values: Record<string, string> = {};

    // Convert FormData to plain object
    formData.forEach((value, key) => {
      if (typeof value === "string") {
        values[key] = value;
      }
    });

    // Validate with schema if provided
    if (schema) {
      try {
        const validatedData = schema.parse(values);
        setErrors({});
        onSubmit(validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          // Format errors for display
          const formattedErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const path = err.path.join(".");
            formattedErrors[path] = err.message;
          });
          setErrors(formattedErrors);
        } else {
          console.error("Validation error:", error);
        }
      }
    } else {
      // No schema, just submit the values
      onSubmit(values);
    }
  };

  // Create context object with errors
  const FormContext = React.createContext<{
    errors: Record<string, string>;
    setFieldError: (name: string, error: string) => void;
  }>({
    errors: {},
    setFieldError: () => {},
  });

  // Function to set an error for a specific field
  const setFieldError = (name: string, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  return (
    <FormContext.Provider value={{ errors, setFieldError }}>
      <form
        onSubmit={handleSubmit}
        className={className}
        id={id}
        noValidate={noValidate}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

// Hook to access form context
export function useFormContext() {
  return React.useContext(
    React.createContext<{
      errors: Record<string, string>;
      setFieldError: (name: string, error: string) => void;
    }>({
      errors: {},
      setFieldError: () => {},
    }),
  );
}

export default Form;

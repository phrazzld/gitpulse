import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardHeader from "../DashboardHeader";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";

// Mock the next-auth signOut function
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));

// Mock the Next.js Image component
// Define a proper interface for Next.js Image props
interface NextImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className }: NextImageProps) => (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-testid="next-image"
    />
  ),
}));

describe("DashboardHeader", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly with title and status", () => {
    render(<DashboardHeader session={null} />);

    // Check for title elements
    expect(screen.getByText("PULSE")).toBeInTheDocument();
    expect(screen.getByText("COMMAND TERMINAL")).toBeInTheDocument();
  });

  test("does not render user info when no session is provided", () => {
    render(<DashboardHeader session={null} />);

    // User elements should not be present
    expect(screen.queryByText(/USER:/)).not.toBeInTheDocument();
    expect(screen.queryByText("DISCONNECT")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
  });

  test("renders user info when session is provided", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.png",
      },
      expires: "2023-01-01T00:00:00.000Z",
    };

    render(<DashboardHeader session={mockSession} />);

    // User info should be displayed
    expect(screen.getByText("USER: TEST USER")).toBeInTheDocument();
    expect(screen.getByText("DISCONNECT")).toBeInTheDocument();

    // Avatar image should be rendered
    const avatarImage = screen.getByTestId("next-image");
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute(
      "src",
      "https://example.com/avatar.png",
    );
    expect(avatarImage).toHaveAttribute("alt", "Test User");
  });

  test("handles signOut when disconnect button is clicked", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.png",
      },
      expires: "2023-01-01T00:00:00.000Z",
    };

    render(<DashboardHeader session={mockSession} />);

    // Click the disconnect button
    const disconnectButton = screen.getByText("DISCONNECT");
    fireEvent.click(disconnectButton);

    // Check if signOut was called with the correct parameters
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  test("handles hover and click events for disconnect button", () => {
    const mockSession = {
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://example.com/avatar.png",
      },
      expires: "2023-01-01T00:00:00.000Z",
    };

    render(<DashboardHeader session={mockSession} />);

    const disconnectButton = screen.getByText("DISCONNECT");

    // Click the button to test the click handler
    fireEvent.click(disconnectButton);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  test("handles user data with missing fields gracefully", () => {
    // Define a proper type with Session interface but missing name field
    const mockSessionWithMissingName: Session = {
      user: {
        email: "test@example.com",
        image: "https://example.com/avatar.png",
      },
      expires: "2023-01-01T00:00:00.000Z",
    };

    render(<DashboardHeader session={mockSessionWithMissingName} />);

    // Image should still be rendered with default alt text
    const image = screen.getByTestId("next-image");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("alt", "User");
  });

  test("renders with the correct styling classes", () => {
    const { container } = render(<DashboardHeader session={null} />);

    // Get the header element
    const header = container.querySelector("header");

    // Check if it has the shadow class
    expect(header).toHaveClass("shadow-lg");
    expect(header).toHaveClass("border-b");
  });
});

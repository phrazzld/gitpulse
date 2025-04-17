import React from "react";
// Import testing-library functions directly instead of from test-utils
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
// Still import the mock session
import { mockSession } from "../../../__tests__/test-utils";
import { signOut } from "next-auth/react";

// Mock next-auth's signOut function
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));

// Mock next/image since it uses client-side features not available in tests
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return (
      <img
        src={props.src}
        alt={props.alt || ""}
        width={props.width}
        height={props.height}
      />
    );
  },
}));

describe("DashboardHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test renders correctly without a session
  it("renders correctly without a session", () => {
    render(<DashboardHeader session={null} />);

    // Should display app name
    expect(screen.getByText("PULSE")).toBeInTheDocument();
    expect(screen.getByText("COMMAND TERMINAL")).toBeInTheDocument();

    // User info and disconnect button should not be present
    expect(screen.queryByText(/USER:/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /disconnect/i }),
    ).not.toBeInTheDocument();
  });

  it("renders correctly with a session", () => {
    render(<DashboardHeader session={mockSession} />);

    // Should display app name
    expect(screen.getByText("PULSE")).toBeInTheDocument();

    // Should display user info
    expect(
      screen.getByText(`USER: ${mockSession.user.name?.toUpperCase()}`),
    ).toBeInTheDocument();

    // Should display user avatar
    const avatar = screen.getByAltText(mockSession.user.name || "User");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute(
      "src",
      expect.stringContaining("avatar.jpg"),
    );

    // Disconnect button should be present
    expect(screen.getByText("DISCONNECT")).toBeInTheDocument();
  });

  it("calls signOut when disconnect button is clicked", () => {
    render(<DashboardHeader session={mockSession} />);

    // Find and click the disconnect button
    const disconnectButton = screen.getByText("DISCONNECT");
    fireEvent.click(disconnectButton);

    // Verify signOut was called with the correct parameters
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});

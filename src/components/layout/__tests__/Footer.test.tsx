import React from "react";
import { render, screen } from "@/__tests__/test-utils";
import { Footer } from "@/components/layout/Footer";
import { NavLink } from "@/types/navigation";

describe("Footer component", () => {
  const mockCopyrightText = "© 2025 GitPulse. All rights reserved.";

  const mockLinks: NavLink[] = [
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Privacy",
      href: "/privacy",
    },
    {
      label: "Terms",
      href: "/terms",
    },
  ];

  it("renders copyright text correctly", () => {
    render(<Footer copyrightText={mockCopyrightText} />);

    expect(screen.getByText(mockCopyrightText)).toBeInTheDocument();
  });

  it("renders navigation links when provided", () => {
    render(<Footer copyrightText={mockCopyrightText} links={mockLinks} />);

    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("Terms")).toBeInTheDocument();
  });

  it("does not render navigation section when no links are provided", () => {
    render(<Footer copyrightText={mockCopyrightText} />);

    const nav = screen.queryByRole("navigation");
    expect(nav).not.toBeInTheDocument();
  });

  it("renders links with correct href attributes", () => {
    render(<Footer copyrightText={mockCopyrightText} links={mockLinks} />);

    // Get all links
    const aboutLink = screen.getByText("About").closest("a");
    const privacyLink = screen.getByText("Privacy").closest("a");
    const termsLink = screen.getByText("Terms").closest("a");

    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(privacyLink).toHaveAttribute("href", "/privacy");
    expect(termsLink).toHaveAttribute("href", "/terms");
  });

  it("renders with proper accessibility attributes", () => {
    render(<Footer copyrightText={mockCopyrightText} links={mockLinks} />);

    const nav = screen.getByRole("navigation");
    expect(nav).toHaveAttribute("aria-label", "Footer Navigation");
  });

  it("applies responsive styling classes", () => {
    render(<Footer copyrightText={mockCopyrightText} links={mockLinks} />);

    const footerElement = screen.getByRole("contentinfo");
    expect(footerElement).toHaveClass("w-full");
    expect(footerElement).toHaveClass("mt-auto");

    // Check for responsive layout classes in the container
    const textElement = screen.getByText(mockCopyrightText);
    const divElement = textElement.closest("div");
    const flexContainer = divElement?.parentElement;

    expect(flexContainer).toHaveClass("flex-col");
    expect(flexContainer).toHaveClass("md:flex-row");
  });

  it("uses Card component from the Core Component Library", () => {
    render(<Footer copyrightText={mockCopyrightText} />);

    // The Card component applies specific classes we can check for
    const cardElement = screen.getByRole("contentinfo").firstChild;
    expect(cardElement).toHaveClass("bg-background-secondary/95");
    expect(cardElement).toHaveClass("backdrop-blur-sm");
    expect(cardElement).toHaveClass("shadow-sm");
    expect(cardElement).toHaveClass("rounded-sm");
  });
});

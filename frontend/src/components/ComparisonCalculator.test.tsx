// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ComparisonCalculator from "./ComparisonCalculator";

// Recharts needs real layout, so the chart is replaced; the data table alternative still renders.
vi.mock("next/dynamic", () => ({ default: () => () => null }));

function fillCustomerDetails() {
  fireEvent.change(screen.getByLabelText("Customer name"), { target: { value: "Sample User" } });
  fireEvent.change(screen.getByLabelText("Customer email"), {
    target: { value: "user@example.com" }
  });
  fireEvent.change(screen.getByLabelText("Customer phone"), {
    target: { value: "+971 50 123 4567" }
  });
}

function setNumber(label: string, value: string) {
  const input = screen.getByLabelText(label);
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
}

function generate() {
  fireEvent.click(screen.getByRole("button", { name: "Generate My Free Comparison" }));
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("comparison calculator", () => {
  it("lists missing customer details instead of showing results", () => {
    render(<ComparisonCalculator />);
    generate();

    const summary = screen.getByRole("alert");
    expect(summary.textContent).toContain("Customer name is required.");
    expect(summary.textContent).toContain("Customer email must be a valid email address.");
    expect(screen.queryByText("Download Excel Comparison")).toBeNull();
  });

  it("generates results that follow the loan term and hide on invalid edits", () => {
    render(<ComparisonCalculator />);
    fillCustomerDetails();
    generate();

    expect(screen.getByRole("heading", { level: 2, name: /at Year 10$/ })).toBeTruthy();
    expect(screen.getByText("10 rows")).toBeTruthy();

    setNumber("Loan payment period in years", "25");
    expect(screen.getByRole("heading", { level: 2, name: /at Year 25$/ })).toBeTruthy();
    expect(screen.getByText("25 rows")).toBeTruthy();
    expect(screen.getAllByLabelText(/^Year \d+ custom market variation$/)).toHaveLength(25);

    setNumber("Property net purchase price", "0");
    expect(screen.queryByText("25 rows")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Property net purchase price");
  });

  it("downloads the browser workbook when no API is configured", async () => {
    const createObjectURL = vi.fn().mockReturnValue("blob:workbook");
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<ComparisonCalculator />);
    fillCustomerDetails();
    generate();
    fireEvent.click(screen.getByRole("button", { name: "Download Excel Comparison" }));

    await waitFor(() =>
      expect(screen.getByText("Your workbook download started successfully.")).toBeTruthy()
    );
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
  });
});

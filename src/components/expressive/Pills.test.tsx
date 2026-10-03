import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Heart } from "lucide-react";
import { TonalPill } from "./Pills";

describe("TonalPill", () => {
	it("shows the count and label", () => {
		render(<TonalPill icon={Heart} value={12} label="liked" />);
		expect(screen.getByText("12")).toBeInTheDocument();
		expect(screen.getByText("liked")).toBeInTheDocument();
	});

	it("shows a dash while the count is loading", () => {
		render(<TonalPill icon={Heart} value={null} label="liked" />);
		expect(screen.getByText("–")).toBeInTheDocument();
	});

	it("is a plain badge without onClick", () => {
		render(<TonalPill icon={Heart} value={3} label="albums" />);
		expect(screen.queryByRole("button")).toBeNull();
	});

	it("becomes a button with onClick", async () => {
		const onClick = vi.fn();
		render(<TonalPill icon={Heart} value={3} label="albums" onClick={onClick} />);
		await userEvent.click(screen.getByRole("button", { name: /albums/ }));
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("wears the tertiary container when asked", () => {
		const { container } = render(<TonalPill icon={Heart} value={1} label="liked" tone="tertiary" />);
		expect(container.firstElementChild).toHaveClass("bg-tertiary-container");
		expect(container.firstElementChild).not.toHaveClass("bg-primary-container");
	});
});

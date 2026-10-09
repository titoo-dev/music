import { describe, it, expect, afterEach, vi } from "vitest";
import { insideForeignLayer, isActivatable, isComposing, letterOf, onRadioGroupKeyDown, ownsKeys } from "./hotkeys";

function el(html: string): HTMLElement {
	const host = document.createElement("div");
	host.innerHTML = html;
	document.body.appendChild(host);
	return host;
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("hotkeys — who owns a key", () => {
	it("text fields, selects and key-handling widgets own the keys", () => {
		const host = el('<input><textarea></textarea><select></select><div role="radio"></div><div role="listbox"></div><div role="slider"></div>');
		for (const child of Array.from(host.children)) expect(ownsKeys(child)).toBe(true);
		expect(ownsKeys(el("<button></button>").firstElementChild)).toBe(false);
		expect(ownsKeys(null)).toBe(false);
	});

	it("buttons, links with an href and role=button take Space", () => {
		const host = el('<button></button><a href="/x"></a><div role="button"></div><summary></summary>');
		for (const child of Array.from(host.children)) expect(isActivatable(child)).toBe(true);
		expect(isActivatable(el("<a></a>").firstElementChild)).toBe(false);
		expect(isActivatable(el("<div></div>").firstElementChild)).toBe(false);
	});

	it("dialogs, alert dialogs and menus are foreign layers; player surfaces aren't", () => {
		expect(insideForeignLayer(el('<div role="dialog"><button></button></div>').querySelector("button"))).toBe(true);
		expect(insideForeignLayer(el('<div role="menu"></div>').firstElementChild)).toBe(true);
		expect(insideForeignLayer(el('<div role="dialog" data-hotkeys="player"><button></button></div>').querySelector("button"))).toBe(false);
		expect(insideForeignLayer(document.body)).toBe(false);
		expect(insideForeignLayer(window)).toBe(false);
	});
});

describe("hotkeys — letterOf", () => {
	it("uses the typed Latin letter, else the physical key", () => {
		expect(letterOf({ key: "M", code: "Semicolon" })).toBe("m");
		expect(letterOf({ key: "ь", code: "KeyM" })).toBe("m");
		expect(letterOf({ key: "ArrowLeft", code: "ArrowLeft" })).toBeNull();
		expect(letterOf({ key: "é", code: "Digit2" })).toBeNull();
	});

	it("detects an IME composition", () => {
		expect(isComposing(new KeyboardEvent("keydown", { key: "a", isComposing: true }))).toBe(true);
		expect(isComposing(new KeyboardEvent("keydown", { key: "Process", keyCode: 229 }))).toBe(true);
		expect(isComposing(new KeyboardEvent("keydown", { key: "a" }))).toBe(false);
	});
});

describe("hotkeys — onRadioGroupKeyDown (HK-07)", () => {
	function group(checked = 0) {
		const host = el(
			`<div role="radiogroup">${[0, 1, 2]
				.map((i) => `<button role="radio" aria-checked="${i === checked}">${i}</button>`)
				.join("")}</div>`
		);
		const groupEl = host.firstElementChild as HTMLElement;
		const radios = Array.from(groupEl.querySelectorAll<HTMLButtonElement>("button"));
		const clicks = radios.map((r) => {
			const fn = vi.fn();
			r.addEventListener("click", fn);
			return fn;
		});
		const key = (k: string, from: HTMLElement) => {
			const e = { key: k, currentTarget: groupEl, target: from, preventDefault: vi.fn() };
			onRadioGroupKeyDown(e);
			return e;
		};
		return { radios, clicks, key };
	}

	it("moves to and selects the next option with ↓ / → and wraps (was: arrows skipped the playing track)", () => {
		const { radios, clicks, key } = group(0);
		const e = key("ArrowDown", radios[0]);
		expect(e.preventDefault).toHaveBeenCalled();
		expect(radios[1]).toHaveFocus();
		expect(clicks[1]).toHaveBeenCalledOnce();
		key("ArrowRight", radios[2]);
		expect(radios[0]).toHaveFocus();
	});

	it("goes back with ↑ / ←, and to the ends with Home / End", () => {
		const { radios, key } = group(1);
		key("ArrowUp", radios[0]);
		expect(radios[2]).toHaveFocus();
		key("Home", radios[2]);
		expect(radios[0]).toHaveFocus();
		key("End", radios[0]);
		expect(radios[2]).toHaveFocus();
	});

	it("doesn't re-select the checked option and ignores other keys", () => {
		const { radios, clicks, key } = group(0);
		key("Home", radios[1]);
		expect(clicks[0]).not.toHaveBeenCalled();
		const e = key("a", radios[0]);
		expect(e.preventDefault).not.toHaveBeenCalled();
	});
});

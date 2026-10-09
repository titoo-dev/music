/**
 * Pure helpers shared by the keyboard shortcut handlers (the app shell's
 * `useKeyboardShortcuts` and the public share player): who already owns a key
 * press, and which letter a press stands for whatever the keyboard layout.
 */

/** Roles whose widgets use letters, Space and the arrows themselves. */
const ROLES_OWNING_KEYS = new Set([
	"slider",
	"switch",
	"combobox",
	"textbox",
	"searchbox",
	"menu",
	"menubar",
	"menuitem",
	"menuitemcheckbox",
	"menuitemradio",
	"listbox",
	"option",
	"tab",
	"radio",
	"checkbox",
	"spinbutton",
	"grid",
	"gridcell",
	"tree",
	"treeitem",
]);

/** Text entry, or a widget that handles the keys itself — shortcuts stay out of its way. */
export function ownsKeys(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return true;
	const role = target.getAttribute("role");
	return role !== null && ROLES_OWNING_KEYS.has(role);
}

/** An element that Space activates (buttons, links, disclosure summaries). */
export function isActivatable(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	if (tag === "BUTTON" || tag === "SUMMARY") return true;
	if (tag === "A" && target.hasAttribute("href")) return true;
	const role = target.getAttribute("role");
	return role === "button" || role === "link";
}

/**
 * A dialog, sheet or menu (Radix or ours) that isn't a player surface. Player
 * surfaces (Now Playing, immersive lyrics) opt back in with `data-hotkeys="player"`.
 */
export function insideForeignLayer(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	return !!target.closest('[role="dialog"]:not([data-hotkeys="player"]), [role="alertdialog"], [role="menu"]');
}

/**
 * The lower-case letter a key press stands for: `e.key` on Latin layouts
 * (so AZERTY's M stays M), the physical key on others (Cyrillic, Greek…).
 */
export function letterOf(e: Pick<KeyboardEvent, "key" | "code">): string | null {
	if (/^[a-z]$/i.test(e.key)) return e.key.toLowerCase();
	if (e.key.length === 1 && /^Key[A-Z]$/.test(e.code)) return e.code.slice(3).toLowerCase();
	return null;
}

const RADIO_STEP: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

/**
 * Arrow / Home / End navigation for a `role="radiogroup"` (put it on the group's
 * onKeyDown): moves the focus to the next enabled radio and selects it, wrapping
 * around, as the ARIA radio group pattern expects.
 */
export function onRadioGroupKeyDown(e: { key: string; currentTarget: HTMLElement; target: EventTarget; preventDefault: () => void }) {
	const radios = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')).filter(
		(r) => !r.hasAttribute("disabled") && r.getAttribute("aria-disabled") !== "true"
	);
	if (!radios.length) return;
	const from = radios.findIndex((r) => r === e.target || r.contains(e.target as Node));
	let to: number;
	if (e.key === "Home") to = 0;
	else if (e.key === "End") to = radios.length - 1;
	else if (e.key in RADIO_STEP && from >= 0) to = (from + RADIO_STEP[e.key] + radios.length) % radios.length;
	else return;
	e.preventDefault();
	radios[to].focus();
	if (radios[to].getAttribute("aria-checked") !== "true") radios[to].click();
}

/** IME composition in progress — the key belongs to the input method. */
export function isComposing(e: KeyboardEvent): boolean {
	return e.isComposing || e.keyCode === 229;
}

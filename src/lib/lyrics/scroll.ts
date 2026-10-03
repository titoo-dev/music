/**
 * Centre a lyric line inside its own scrolling column.
 *
 * `scrollIntoView` walks every scrollable ancestor: once the column runs out of room (the last lines of a
 * track) it scrolls the `overflow-hidden` overlay around it instead, pushing the top bar and its close
 * button off-screen. Scrolling only the column keeps the chrome where it is.
 */
export function centerLine(container: HTMLElement, line: HTMLElement, behavior: ScrollBehavior = "smooth") {
	const box = container.getBoundingClientRect();
	const target = line.getBoundingClientRect();
	const offset = target.top + target.height / 2 - (box.top + box.height / 2);
	container.scrollTo({ top: Math.max(0, container.scrollTop + offset), behavior });
}

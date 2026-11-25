import { Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	parseTheme,
	THEME_META_COLORS,
	THEME_STORAGE_KEY,
	type Theme,
} from "@/lib/theme";

function applyTheme(theme: Theme) {
	document.documentElement.dataset.theme = theme;
	document.documentElement.style.colorScheme = theme;
	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", THEME_META_COLORS[theme]);
}

export function ThemeToggle() {
	const [theme, setTheme] = useState<Theme>(
		() => parseTheme(document.documentElement.dataset.theme) ?? "dark",
	);

	const toggle = () => {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		applyTheme(next);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, next);
		} catch {
			// Private browsing can deny storage; the theme still applies for this page.
		}
	};

	return (
		<Button
			aria-pressed={theme === "light"}
			onClick={toggle}
			size="sm"
			type="button"
			variant="outline"
		>
			<Sun aria-hidden="true" className="size-4" />
			<span>Light mode</span>
		</Button>
	);
}

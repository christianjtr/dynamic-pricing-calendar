import { Moon, Sun } from "lucide-react";
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
	const nextTheme = theme === "dark" ? "light" : "dark";
	const NextIcon = nextTheme === "light" ? Sun : Moon;

	const toggle = () => {
		setTheme(nextTheme);
		applyTheme(nextTheme);
		try {
			localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
		} catch {
			// Private browsing can deny storage; the theme still applies for this page.
		}
	};

	return (
		<Button onClick={toggle} size="sm" type="button" variant="outline">
			<NextIcon aria-hidden="true" className="size-4" />
			<span>{nextTheme === "light" ? "Light mode" : "Dark mode"}</span>
		</Button>
	);
}

import { type MantineSize, rem } from "@mantine/core";

interface HeaderTokens {
	height: string;
}

interface LogoTokens {
	genieHeight: string;
	textHeight: string;
	color: string;
}

interface ResponsiveTokens {
	mainBreakpoint: MantineSize;
}

interface LayoutTokens {
	header: HeaderTokens;
	logo: LogoTokens;
	responsive: ResponsiveTokens;
}

export const BRAND_COLORS = {
	primary: "#5B48EE",
} as const;

export const layoutTokens: LayoutTokens = {
	header: {
		height: rem(100),
	},
	logo: {
		genieHeight: rem(70),
		textHeight: rem(48),
		color: BRAND_COLORS.primary,
	},
	responsive: {
		mainBreakpoint: "sm",
	},
};

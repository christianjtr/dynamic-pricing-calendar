import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { pricingCalendarTheme } from "./theme";

export interface PricingCalendarUIProviderProps {
	children: ReactNode;
}

export function PricingCalendarUIProvider({
	children,
}: PricingCalendarUIProviderProps) {
	return (
		<MantineProvider theme={pricingCalendarTheme}>{children}</MantineProvider>
	);
}

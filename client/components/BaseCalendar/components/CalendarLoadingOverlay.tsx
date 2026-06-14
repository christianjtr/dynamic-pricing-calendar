import { LoadingOverlay } from "@mantine/core";
import { BRAND_COLORS } from "../../../theme/tokens";

interface CalendarLoadingOverlayProps {
	isLoading: boolean;
}

export const CalendarLoadingOverlay: React.FC<CalendarLoadingOverlayProps> = (
	props,
) => {
	const { isLoading } = props;

	return (
		<LoadingOverlay
			visible={isLoading}
			zIndex={10}
			overlayProps={{ radius: "sm", blur: 1.5, opacity: 0.9 }}
			loaderProps={{ color: BRAND_COLORS.primary, type: "dots" }}
		/>
	);
};

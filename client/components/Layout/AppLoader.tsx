import {
	Center,
	Loader,
	type MantineLoader,
	type MantineSize,
} from "@mantine/core";
import type React from "react";
import { BRAND_COLORS } from "../../theme";

interface AppLoaderProps {
	height?: string | number;
	size?: MantineSize;
	type?: MantineLoader;
}

export const AppLoader: React.FC<AppLoaderProps> = (props) => {
	const { height = "100vh", size = "xl", type = "dots" } = props;

	return (
		<Center h={height}>
			<Loader color={BRAND_COLORS.primary} size={size} type={type} />
		</Center>
	);
};

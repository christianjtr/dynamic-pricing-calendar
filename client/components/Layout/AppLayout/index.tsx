import {
	AppShell,
	Box,
	Container,
	Divider,
	Group,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import { layoutTokens } from "../../../theme";
import { SettingsPanel } from "../SettingsPanel";
import { RoomPriceGenieLogo } from "./components/RoomPriceGenieLogo";

interface AppLayoutProps {
	children: React.ReactNode;
	title?: string;
	subtitle?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
	const {
		children,
		title = "Pricing Calendar",
		subtitle = "Real-time rate optimization",
	} = props;

	const { header } = layoutTokens;

	return (
		<AppShell header={{ height: header.height }} padding="md">
			<AppShell.Header px={{ base: "md", sm: "xl" }}>
				<Group h="100%" justify="space-between" wrap="nowrap">
					<Group gap="xl" align="center" wrap="nowrap">
						<RoomPriceGenieLogo />
						<Group gap="xl" align="center" wrap="nowrap" visibleFrom="sm">
							<Divider orientation="vertical" />
							<Stack gap={2}>
								<Title order={1} size="h2" fw={700}>
									{title}
								</Title>
								<Text size="xs" c="dimmed">
									{subtitle}
								</Text>
							</Stack>
						</Group>
					</Group>
					<Group gap="md" wrap="nowrap">
						<SettingsPanel />
					</Group>
				</Group>
			</AppShell.Header>

			<AppShell.Main bg="gray.1">
				<Container size="xl" p={0}>
					<Box component="section">{children}</Box>
				</Container>
			</AppShell.Main>
		</AppShell>
	);
};

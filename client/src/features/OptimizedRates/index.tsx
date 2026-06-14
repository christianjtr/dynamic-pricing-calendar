import { useHotelSettingsContext } from "@/context/HotelSettingsContext";
import { BRAND_COLORS } from "@/theme";
import { Badge, Container, Group, Stack, Text, Title } from "@mantine/core";
import { IconBed } from "@tabler/icons-react";
import { PricingCalendar } from "./components/PricingCalendar";

export const OptimizedRatesDashboard: React.FC = () => {
	const { activeRoomName, selectedRoomId } = useHotelSettingsContext();

	return (
		<Container size="fluid" px="xl" py="xl">
			<Stack gap={2} mb="lg">
				<Group justify="space-between" align="center" wrap="nowrap">
					<Group gap="sm" wrap="nowrap" align="center">
						<Group gap="xs" wrap="nowrap">
							<IconBed size={26} stroke={2} color={BRAND_COLORS.primary} />
							<Title
								order={3}
								fw={800}
								c="gray.8"
								style={{ letterSpacing: "-0.5px" }}
							>
								Optimized Room Rates
							</Title>
						</Group>
						{selectedRoomId && (
							<Badge
								variant="light"
								color="indigo"
								size="sm"
								radius="sm"
								visibleFrom="xs"
							>
								{activeRoomName}
							</Badge>
						)}
					</Group>
				</Group>
				<Text size="xs" c="dimmed" fw={500}>
					Displaying optimized pricing data for the selected month
				</Text>
			</Stack>

			<PricingCalendar />
		</Container>
	);
};

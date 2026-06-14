import { Button, Divider, Popover, Select, Stack, Text } from "@mantine/core";
import { IconBuildingCog } from "@tabler/icons-react";
import { useState } from "react";
import { useHotelSettingsContext } from "../../context/HotelSettingsContext";
import { BRAND_COLORS } from "../../theme";
import { SUPPORTED_LOCALES } from "../../utils/browserAPI";

export const SettingsPanel: React.FC = () => {
	const {
		locale,
		handleLocaleChange,
		timezone,
		setTimezone,
		roomSelectOptions,
		setSelectedRoomId,
		selectedRoomId,
	} = useHotelSettingsContext();

	const [popoverOpened, setPopoverOpened] = useState<boolean>(false);
	const [timezones, setTimezones] = useState<string[]>(
		() => new Intl.Locale(locale).getTimeZones?.() || [],
	);

	const handleOnSelectLocale = (value: string) => {
		const selectedLocale = new Intl.Locale(value);
		const zones = selectedLocale.getTimeZones?.() || [];

		handleLocaleChange(value);
		setTimezones(zones);
		setTimezone(null);
	};

	return (
		<Popover
			width={360}
			position="bottom-end"
			withArrow
			shadow="md"
			radius="md"
			opened={popoverOpened}
			onChange={setPopoverOpened}
			closeOnClickOutside={true}
		>
			<Popover.Target>
				<Button
					color={BRAND_COLORS.primary}
					size="sm"
					radius="sm"
					fw={600}
					leftSection={<IconBuildingCog size={26} stroke={1.5} />}
					onClick={() => setPopoverOpened((opened) => !opened)}
				>
					Hotel Config
				</Button>
			</Popover.Target>

			<Popover.Dropdown p="md">
				<Stack gap="md">
					<Text size="sm" fw={700} c="gray.8">
						Hotel Parameters
					</Text>
					<Divider color="gray.2" />

					<Select
						label="Hotel Locale"
						size="xs"
						data={SUPPORTED_LOCALES}
						value={locale || ""}
						onChange={(val) => val && handleOnSelectLocale(val)}
						comboboxProps={{ withinPortal: false }}
					/>

					<Select
						label="Property Timezone"
						size="xs"
						data={timezones}
						value={timezone}
						onChange={(val) => setTimezone(val)}
						comboboxProps={{ withinPortal: false }}
						disabled={timezones.length === 0}
						placeholder={
							timezones.length === 0
								? "Select a locale first"
								: "Choose timezone"
						}
					/>

					<Select
						label="Active Room Type on Calendar"
						size="xs"
						data={roomSelectOptions}
						value={selectedRoomId || ""}
						onChange={(val) => val && setSelectedRoomId(val)}
						comboboxProps={{ withinPortal: false }}
					/>

					<Divider color="gray.1" mt="xs" />

					<Button
						variant="light"
						color={BRAND_COLORS.primary}
						size="xs"
						fullWidth
						onClick={() => setPopoverOpened(false)}
					>
						Close Configuration
					</Button>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
};

import { Alert, Button, Container, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

import { BRAND_COLORS } from "@/theme";
import {
	type FallbackProps,
	ErrorBoundary as ReactErrorBoundary,
} from "react-error-boundary";

const ErrorFallback: React.FC<FallbackProps> = ({
	error,
	resetErrorBoundary,
}) => {
	const errorMessage = error instanceof Error ? error.message : String(error);

	return (
		<Container size="sm" py="xl">
			<Stack gap="md">
				<Alert
					icon={<IconAlertTriangle size={24} />}
					color="red"
					radius="md"
					title="Application Error"
					variant="light"
				>
					<Text>{errorMessage}</Text>
				</Alert>

				<Stack gap="xs" mt="xs">
					<Button
						color={BRAND_COLORS.primary}
						onClick={resetErrorBoundary}
						fullWidth
					>
						Try Again
					</Button>
					<Button
						variant="light"
						color="gray"
						onClick={() => window.location.reload()}
						fullWidth
					>
						Reload Application
					</Button>
				</Stack>
			</Stack>
		</Container>
	);
};

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
	return (
		<ReactErrorBoundary
			FallbackComponent={ErrorFallback}
			onError={(error) => console.error("❌ Error Boundary:", error)}
		>
			{children}
		</ReactErrorBoundary>
	);
};

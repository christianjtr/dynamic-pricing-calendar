import type { DayPrice, UpdatePriceResponse } from "@hpc/contracts";
import {
	Alert,
	Button,
	Group,
	NumberInput,
	Paper,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import { useState } from "react";
import type { UpdatePriceVariables } from "../client";
import { DayIndicators } from "./DayIndicators";
import { formatCurrency } from "./format";

export interface PriceMutation {
	data?: UpdatePriceResponse;
	error: Error | null;
	isError: boolean;
	isPending: boolean;
	mutate: (variables: UpdatePriceVariables) => void;
	reset: () => void;
}

export interface EditPanelProps {
	day: DayPrice;
	mutation: PriceMutation;
	onClose: () => void;
}

export function EditPanel({ day, mutation, onClose }: EditPanelProps) {
	const [price, setPrice] = useState<number | string>(day.price ?? 0);
	const [reason, setReason] = useState("");

	const canSave =
		typeof price === "number" &&
		price >= 0 &&
		!day.isClosed &&
		!mutation.isPending;

	return (
		<Paper
			aria-busy={mutation.isPending}
			className="hpc-shell"
			p="md"
			withBorder
		>
			<Group justify="space-between">
				<div>
					<Title order={4}>{day.date}</Title>
					<Text c="dimmed" size="sm">
						{day.roomId}
					</Text>
				</div>
				<Button onClick={onClose} size="xs" variant="subtle">
					Close
				</Button>
			</Group>
			<DayIndicators day={day} />
			<NumberInput
				label={`Price (${day.currency})`}
				min={0}
				onChange={setPrice}
				value={price}
			/>
			<TextInput
				label="Reason (optional)"
				maxLength={500}
				onChange={(event) => setReason(event.currentTarget.value)}
				value={reason}
			/>
			<Group justify="flex-end">
				<Button
					disabled={!canSave}
					loading={mutation.isPending}
					onClick={() =>
						mutation.mutate({
							roomId: day.roomId,
							date: day.date,
							price: typeof price === "number" ? price : 0,
							reason: reason.trim() || undefined,
						})
					}
				>
					Save price
				</Button>
			</Group>
			{mutation.isError ? (
				<Alert color="red" role="alert" title="Could not save price">
					{mutation.error?.message ?? "Unknown error"}
				</Alert>
			) : null}
			{mutation.data ? (
				<Alert color="green" role="status" title="Saved by backend">
					Canonical price:{" "}
					{formatCurrency(mutation.data.day.price, mutation.data.day.currency)}
				</Alert>
			) : null}
		</Paper>
	);
}

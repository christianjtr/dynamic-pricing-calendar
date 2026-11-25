import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				outline: "border bg-transparent hover:bg-secondary",
				ghost: "hover:bg-secondary",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 px-3",
				icon: "h-9 w-9",
			},
		},
		defaultVariants: { variant: "default", size: "default" },
	},
);

export interface ButtonProps
	extends ComponentProps<"button">,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

export function Button({
	asChild,
	className,
	variant,
	size,
	...props
}: ButtonProps) {
	const Component = asChild ? Slot : "button";
	return (
		<Component
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

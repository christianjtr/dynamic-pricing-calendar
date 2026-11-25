import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
	{
		variants: {
			variant: {
				default: "border-primary bg-primary/10 text-foreground",
				secondary: "border-transparent bg-secondary text-secondary-foreground",
				outline: "text-muted-foreground",
				destructive: "border-destructive text-destructive",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

export interface BadgeProps
	extends ComponentProps<"span">,
		VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const links = [
	{ href: "/", label: "Calendar" },
	{ href: "/faq", label: "How to use" },
	{ href: "/docs", label: "API Docs" },
] as const;

export function SiteHeader() {
	const pathname = window.location.pathname.replace(/\/$/, "") || "/";

	return (
		<header className="border-b bg-card/40">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
				<a
					className="rounded-md font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					href="/"
				>
					Pricing Calendar Reference
				</a>
				<nav aria-label="Main" className="flex flex-wrap items-center gap-1">
					{links.map((link) => {
						const active = pathname === link.href;
						return (
							<Button
								asChild
								key={link.href}
								size="sm"
								variant={active ? "secondary" : "ghost"}
							>
								<a aria-current={active ? "page" : undefined} href={link.href}>
									{link.label}
								</a>
							</Button>
						);
					})}
					<ThemeToggle />
				</nav>
			</div>
		</header>
	);
}

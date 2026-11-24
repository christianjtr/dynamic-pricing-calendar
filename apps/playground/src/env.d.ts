declare module "*.css" {}

declare module "*.yaml?raw" {
	const content: string;
	export default content;
}

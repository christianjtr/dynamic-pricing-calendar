# External consumer smoke app

This small Vite app exercises the public SDK exports without importing workspace
packages. Run `pnpm test:external-consumer` from the repository root; the script
packs the SDK and contracts, installs those tarballs into a temporary consumer,
then type-checks and builds it.

The SDK is not released to a package registry yet. The test uses packed artifacts
to verify the consumer boundary before a release process is chosen.

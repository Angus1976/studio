# Stable Configuration Reference

This document outlines the key details of the stable working configuration for this Next.js project as of 2025-08-12. It serves as a reference to prevent and troubleshoot future build or startup errors.

## 1. Key Dependencies (`package.json`)

The project stability relies on specific versions of key packages. Any changes to these may require careful testing.

- **Next.js Version**: The application is stable on `next@14.2.3`. Upgrading this may re-introduce compatibility issues seen previously.
  ```json
  "next": "14.2.3",
  ```

- **Development Script**: The `dev` script should be kept simple to avoid conflicts with parameters injected by the development environment. The `--turbopack` flag was removed for stability.
  ```json
  "scripts": {
    "dev": "next dev",
    ...
  },
  ```

- **AI/Genkit Dependencies**: All `genkit` and `@genkit-ai/*` packages have been **removed**. They were found to be incompatible with `next@14.x`, causing `npm install` failures. Re-enabling AI features will require finding compatible versions or upgrading the entire Next.js stack and resolving any new issues that arise.

## 2. Next.js Configuration (`next.config.js`)

The configuration file **must** be named `next.config.js` and use the CommonJS `module.exports` syntax. Using `next.config.ts` is not supported by the current setup and will cause startup failures.

- **Correct Filename**: `next.config.js`
- **Correct Syntax**:
  ```javascript
  /** @type {import('next').NextConfig} */
  const nextConfig = {
    /* config options here */
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'placehold.co',
          port: '',
          pathname: '/**',
        },
      ],
    },
  };

  module.exports = nextConfig;
  ```

## 3. Disabled AI Features

The AI flows located in `src/ai/flows/` are currently commented out because their `genkit` dependencies were removed. To re-enable them, you must:
1.  Find `genkit` package versions that are compatible with `next@14.2.3`.
2.  Or, upgrade `next` to `15.x` and ensure all other dependencies are compatible, then re-install the latest `genkit` packages.
3.  Uncomment the code in the flow files (e.g., `src/ai/flows/ai-requirements-navigator.ts`) and the `genkit` initialization file (`src/ai/genkit.ts`).

By adhering to these configurations, the application should remain stable.

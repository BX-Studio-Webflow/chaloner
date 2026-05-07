# Chaloner Frontend (Webflow Bundle)

This package builds the client-side JavaScript injected into the Webflow site.

## Local development

```bash
pnpm install
pnpm dev
```

## Build

```bash
pnpm build
```

Build output is written to `dist/`.

## Deployment (GitHub + jsDelivr)

1. Commit and push frontend changes to GitHub.
2. Note the commit SHA that contains the new `dist/all-new.js` artifact.
3. Update the Webflow custom code script tag to point to that SHA:

```html
<script src="https://cdn.jsdelivr.net/gh/BX-Studio-Webflow/chaloner@0bebe62/chaloner-client/dist/all-new.js"></script>
```

4. Publish Webflow.

Notes:
- Replace `0bebe62` with the target commit SHA for the deployment you want to serve.
- If the old file is cached, hard refresh or append a temporary query string while validating.

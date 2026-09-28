# Welcome to your Lovable project

## Presentation Builder catalogue assets

The builder resolves supplied product `slug`, `sku`, or `name` through the live
`catalog-read` service before downloading images. Set
`INNER_SPACE_CATALOG_AGENT_TOKEN` in the process environment (never commit it).
`INNER_SPACE_CATALOG_READ_URL` optionally overrides the default live endpoint.
Tokens require `catalog:read_sales` or `catalog:read_cost`; this client does not
change the service's filtering of commercial fields.

`AssetManager.resolve(key)` exposes the authoritative `image`, first available
`life`, complete `lifestyle_images` and `images` lists, and collection
`technical_spec_pdf_url`. Existing presentation copy/spec formatting is retained.
No technical pages or PDF layout changes are introduced. Catalogue matches never
reuse hardcoded asset URLs. Missing primary/lifestyle assets fail when required;
authentication, network, malformed responses and ambiguous names also fail closed.
Only confirmed catalogue absence retains the existing supplied-URL path.
There is no website scraper or image-generation fallback.

Asset caches include the resolved URL hash, preventing an older cached product
image from overriding the live catalogue. Resolution is cached per AssetManager
instance; a new build process reads the catalogue again. Builder runs now require
the catalogue token, including CI; no workflow or secret configuration is changed here.

Asset-only checks (no presentation builds, publishing or delivery):

```sh
python -m pytest tests/test_catalog_read.py -q
# Live name/slug checks for Assisi and Roma, plus SKU NL0212; prints asset URLs.
# Skips explicitly when the environment token is unavailable.
python -m pytest tests/test_catalog_read.py -k live -s -q
```

Mock asset URLs under `assets.example` are synthetic test fixtures, not live results.

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

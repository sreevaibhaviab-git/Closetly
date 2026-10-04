# Closetly — Phase 1 (frontend only)

The Closetly landing page, auth screens, and dashboard shell, built with
Next.js App Router + TypeScript. No backend, no auth, no AI — every
interaction is local to the browser.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Routes

| Route                 | Page             |
| ---------------------- | ----------------- |
| `/`                    | Landing page      |
| `/login`               | Log in            |
| `/signup`              | Create account    |
| `/app`                 | Dashboard         |
| `/app/closet`          | My closet         |
| `/app/closet/upload`   | Upload clothing   |
| `/app/style`           | Style me          |
| `/app/outfits`         | Saved outfits     |

Log in / create account submit locally and route straight to `/app` —
there's no real authentication yet.

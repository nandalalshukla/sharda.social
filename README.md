# Sharda Social — mobile app

The Android and iOS app for [sharda.social](https://sharda.social): the campus
feed, the notes / PYQs / syllabus library, profiles, notifications, and the
moderator and admin dashboards — against the **same backend** as the website.

Expo SDK 58 · React Native 0.88 · Expo Router · TypeScript · TanStack Query ·
Zustand · Reanimated.

## Run it

```bash
cd app
npm install                  # .npmrc sets legacy-peer-deps (Expo pins react 19.3.0)
cp .env.example .env         # EXPO_PUBLIC_API_URL -> the Render backend
npx expo start
```

`EXPO_PUBLIC_API_URL` is the backend **origin** with no path (the app adds
`/api/v1`). In development, if it is unset the app talks to port 5000 on the
machine running Metro, so a phone on the same Wi-Fi works with no setup. A
release build refuses to start without it and says so on screen.

Camera, secure storage and the date picker need a real device or a development
build for full fidelity; Expo Go works for most screens.

```bash
npm run typecheck            # tsc --noEmit
npm run doctor               # expo-doctor
npx expo export --platform all   # proves both bundles compile
```

### Building

```bash
npx eas-cli@latest build --profile preview --platform android   # installable APK
npx eas-cli@latest build --profile production --platform all    # store builds
```

Each profile in `eas.json` already sets `EXPO_PUBLIC_API_URL` to the Render backend
(`https://notes-pyqssharda-backend.onrender.com`); change it there for a staging server. Bundle ids are `social.sharda.app` on both platforms — change
them in `app.json` before the first store build if you want a different id.

## How it talks to the backend

The website authenticates with `httpOnly` cookies. A native client can't rely on
those (the OS cookie jar isn't reliably persisted, and the app can't see or
rotate a token), so the backend gained a small **additive** change — see
`notesandpyqssharda-backend/src/utils/clientTokens.ts`:

| | Website | App |
| --- | --- | --- |
| Identifies as | (nothing) | `X-Client-Platform: mobile` |
| Gets tokens | cookies | in the JSON body (`data.tokens`) |
| Sends tokens | cookies | `Authorization: Bearer …`, `X-Refresh-Token` |

A request without the header behaves exactly as before. **The backend must be
redeployed with this change before the app can sign in.**

`src/api/client.ts` refreshes the access token ~30 s before it expires (the feed
and profiles treat an expired token as "anonymous" rather than answering 401, so
waiting for a 401 would quietly show a signed-in user the logged-out app), and
shares one refresh request between concurrent callers because the backend
rotates the refresh token on every use. Only a definitive 400/401/403 from the
refresh endpoint signs the user out — a dropped connection never does.

## Layout

```
src/
  app/            Expo Router routes (tabs, auth modal, post, profile, library, mod, admin…)
  api/            axios client, token storage, typed endpoint modules
  hooks/          React Query hooks, optimistic cache patching, like engine
  stores/         Zustand: auth session
  components/     ui/ primitives, social/, library/, moderation/, admin/, forms/
  theme/          "Vibrant Campus" tokens (same values as the website), light + dark
  data/           the curated B.Tech CS notes & syllabus lists (copied from the site)
  constants/      programmes, post types, library kinds
```

Design decisions worth knowing:

- **Guests can browse**, exactly like the website. Anything that writes goes
  through `useRequireAuth`.
- **Likes coalesce.** The like endpoint is a toggle, so rapid taps are collapsed
  to one in-flight request per target (`hooks/likeEngine.ts`).
- **Notifications poll** the unread-count endpoint every 45 s while foregrounded.
  React Native has no `EventSource`, so the website's SSE stream isn't used —
  the same polling fallback the website documents.
- **Toasts vs. modals:** a root-level toast is hidden behind a native modal, so
  forms inside modals show errors inline and raise success toasts after dismiss.
- **Modals are serialised** (`components/ui/modalGate.ts`) because iOS drops a
  modal presented while another is still animating out.

## Not included

- The paid **Services** area described in the repo `AGENTS.md` (resume / report /
  PPT generators, wallet, Razorpay): the backend's `index.ts` does not register
  `/api/v1/services`, so there is nothing for the app to call yet.
- Push notifications (the website doesn't have them either).

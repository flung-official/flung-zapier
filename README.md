<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://assets.flung.dev/brand/logo/flung-lockup-on-dark.svg">
    <img alt="Flung" src="https://assets.flung.dev/brand/logo/flung-lockup-on-light.svg" width="260">
  </picture>
</p>

# Flung for Zapier

The Flung app on Zapier: schedule social media posts from any Zap, and start a Zap when a post goes out or fails.

## TL;DR

| Question | Answer |
|---|---|
| What do I need? | A Flung API key (`flung_sk_...`), made in Settings, API keys. |
| How do triggers arrive? | Instantly: turning a Zap on registers a webhook with Flung, and turning it off removes it. |
| What about approvals? | A workspace that needs approval holds the post: the answer's `status` is then `pending_approval`. |

## What it does

| Kind | Name |
|---|---|
| Trigger | Post Published, Post Failed, Account Needs Reconnecting, New Inbox Item |
| Action | Create Post (publish now or schedule, with media by address and short links), Cancel Post |
| Search | Find Account |

## Develop

```sh
npm install
npm test
npx zapier-platform validate
```

## Release

The app is pushed to Zapier with its command line, signed in as the account that owns the integration:

```sh
npx zapier-platform login
npx zapier-platform register "Flung"   # once, which writes .zapierapprc
npx zapier-platform push
```

Set `version` in `package.json` for each new version. Zapier reviews an integration before listing it publicly.

## Docs

[docs.flung.dev](https://docs.flung.dev) covers the API, webhooks and every platform.

## License

[MIT](./LICENSE)

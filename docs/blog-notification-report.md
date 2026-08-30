# Blog Notification Status

Date: 2026-08-29

## Current Production Setup

The notification stack is now implemented and no longer in planning mode.

- **Canonical publish source:** RSS feed at `/feed.xml` generated during build.
- **On-site subscribe UX:** `FollowItSubscribeForm` on `/contact/`, `/blog/`, and individual `/blog/<slug>/` pages posts directly to follow.it.
- **Secondary feed channel:** Footer includes a `Subscribe via RSS` link for feed-reader users.
- **Delivery model:** follow.it polls the RSS feed and sends email notifications to subscribers.

This architecture matches the static-export + GitHub Pages deployment model and keeps mailing list operations off-platform.

## Operational Runbook

1. Publish a post by adding markdown in `content/posts/*.md` and deploying.
2. Confirm the new post appears in `/feed.xml` after deploy.
3. follow.it will detect the new feed item and send email notifications.
4. If no notification is sent, verify feed validity first (broken feed blocks all notifications).

## Maintenance Notes

- Keep feed URLs and post permalinks stable to avoid duplicate or missed notifications.
- Treat `feed.xml` generation as a release-critical artifact.
- Revisit provider choice only if requirements change (e.g., list ownership, segmentation, custom campaigns).

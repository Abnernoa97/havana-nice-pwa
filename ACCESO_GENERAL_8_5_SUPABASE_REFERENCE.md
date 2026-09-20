# ACCESO GENERAL 8.5 — SUPABASE REFERENCE

Project: `xzfradccsxonmauinecl`

Checkpoint companion for `ACCESO_GENERAL_8_5.md`.

## Latest migration at checkpoint

`20260920041942 — use_hash_routes_for_push_targets`

## Push destinations

- Chat: `https://havana-nice-pwa.pages.dev/#chat`
- Admin notifications: `https://havana-nice-pwa.pages.dev/#notifications`

## Active Edge Function versions

- send-musician-push: v2
- passkey-options: v2
- passkey-register-verify: v2
- passkey-auth-options: v2
- passkey-auth-verify: v2
- passkey-status: v2
- family-profile-media-v1: v7
- storage-maintenance-v1: v7
- admin-publish-notification-v1: v3
- chat-video-transcode-v1: v5

## Public tables present

- profiles
- profile_realtime
- repertoire_songs
- repertoire_realtime
- musician_backgrounds
- notifications
- calendar_events
- chat_messages
- chat_settings
- calendar_event_recipients
- musician_push_subscriptions
- app_background_config
- family_profiles
- musician_devices
- musician_access_alerts

All were reported with RLS enabled at checkpoint creation.

This file intentionally contains no secrets and no production row data.

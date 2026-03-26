# POSTMAN - The Virtual Letter

## Current State
- Backend: Motoko canister with user profiles, username system, letter sending/signing, inbox/outbox. No friend system methods exist in backend. No delivery timer stored in backend.
- Frontend: Inbox shows all letters and allows opening immediately (no delivery gate). ProfilePage shows username card (no copy/share buttons) and change-username form (no friends list). DeliveryStore tracks delivery timing only in sender's localStorage.

## Requested Changes (Diff)

### Add
- Backend: `deliveryTime: Int` field on `Letter` and `LetterDetail` — set to `Time.now() + random(1-120) * 1_000_000_000` when letter is sent
- Backend: Full friend system — send/accept/decline/remove friend requests, list friends and pending requests
- Frontend: Delivery lock screen in Inbox — if current time < deliveryTime, show animated "postman is on the way" screen with countdown timer; letter content is fully locked until timer expires
- Frontend: Friends list section in ProfilePage — shows accepted friends with username, remove button
- Frontend: Copy button and Share button on username card in ProfilePage — Copy copies @username to clipboard; Share shares a link like `?addUser=username`
- Frontend: On app load, detect `?addUser=username` URL param and navigate to a pre-filled friend search

### Modify
- Backend: `sendLetter` — also set `deliveryTime` on the new letter
- Backend: `LetterDetail` — add `deliveryTime: Int` field
- Frontend: Inbox `LetterOpener` — check `deliveryTime` vs current time before showing sign/reveal flow
- Frontend: ProfilePage — add friends list section below change-username section

### Remove
- Nothing removed

## Implementation Plan
1. Regenerate backend with deliveryTime on letters and full friend system methods
2. Update frontend bindings (backend.d.ts, declarations)
3. Update Inbox.tsx to gate on deliveryTime
4. Update ProfilePage.tsx to add friends list and copy/share on username
5. Update useQueries.ts to add friend hooks
6. Handle ?addUser= URL param in App.tsx or MainApp.tsx

# POSTMAN - The Virtual Letter

## Current State
Empty scaffold with Motoko backend and React/TypeScript frontend.

## Requested Changes (Diff)

### Add
- User authentication (login/register with principal identity)
- Letter composition page: rich text editor with parchment/paper background, handwriting-style font options
- Postage stamp selector: Indian and Pakistani vintage stamps as selectable UI components
- Letter inbox and outbox views
- Letter delivery status: Pending -> In Transit -> Delivered states with timestamps
- Delivery tracking visual: animated map showing letter traveling from sender to recipient city
- Signature page: users can draw or type their signature, stored per user
- Postman bell notification: visual/audio notification when a new letter arrives
- Recipient lookup: search for registered users by name to send letters
- Letter sealing animation: wax seal effect when sending

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Backend: User profiles (name, city, signature), Letters (sender, recipient, body, stamp, status, timestamps), CRUD operations for letters, user search
2. Frontend: Auth flow, compose letter page with stamp picker, inbox/outbox list, letter detail view with vintage styling, tracking animation, bell notification on new arrivals
3. Use authorization component for login
4. Vintage parchment UI with warm browns, sepia tones, aged paper textures via CSS

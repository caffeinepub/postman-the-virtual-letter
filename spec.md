# POSTMAN - The Virtual Letter

## Current State
The app has several bugs:
1. useActor.ts awaits `_initializeAccessControlWithSecret` (already fixed in this session)
2. ComposeLetter has a "Search by Name" tab that sets a recipient without a principal, causing "Could not resolve recipient address" error
3. Outbox shows letters as bare IDs with no letter content/details visible
4. Backend and frontend enforce a 14-day cooldown for username changes

## Requested Changes (Diff)

### Add
- Fetch full LetterDetail in Outbox LetterRow to show body preview and type (letter vs voice note)

### Modify
- ComposeLetter: Remove the Tabs (Search by Name / Find by Username). Replace with a single username search input (no tabs). The recipient section should only show username search.
- Outbox LetterRow: Call `useGetLetter(letterId)` to fetch letter details and display: whether it's a voice note or letter, a body snippet, timestamp
- ProfilePage: Remove "Allowed after 14 days" text. Remove `too_soon` error handler. Make the change button always enabled (when username is valid and available)
- Backend main.mo: Remove the 14-day check from setUsername (the `if (now - lastChange < fourteenDaysNs)` block)

### Remove
- Name-based search tab and related state (recipientSearch, showDropdown, searchResults, useSearchProfiles import) from ComposeLetter
- 14-day cooldown check from backend setUsername function
- 14-day restriction UI text from ProfilePage

## Implementation Plan
1. Edit ComposeLetter.tsx: remove tabs, name search state, show only username search box directly
2. Edit Outbox.tsx: add useGetLetter hook call per row, display body preview
3. Edit ProfilePage.tsx: remove 14-day restriction copy and `too_soon` handler
4. Edit backend main.mo: remove 14-day check

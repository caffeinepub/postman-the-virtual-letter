# POSTMAN - The Virtual Letter

## Current State
LandingPage shows India Post and Pakistan Post labels. ComposeLetter has only India/Pakistan stamps. Letters show sender info already via senderName prop.

## Requested Changes (Diff)

### Add
- Country stamp groups in ComposeLetter: Canada, Iran, Dubai, New Zealand, Australia, London (UK) in addition to India and Pakistan

### Modify
- LandingPage: Remove India Post / Pakistan Post text labels
- ComposeLetter: Expand stamp picker with all 8 countries grouped by country
- Any letter views showing "Delivered by the postman": replace with sender username

### Remove
- India Post / Pakistan Post labels from LandingPage

## Implementation Plan
1. Edit LandingPage.tsx to remove postal service labels
2. Edit ComposeLetter.tsx to add stamp groups for all 8 countries
3. Check Inbox.tsx for delivery text and replace with sender username
4. Validate

# Figma-ready UI Specification

## Availability note

The connected Figma account was authenticated during this documentation pass, but its seat exposed read-only access. No editable Figma file or Figma URL was created. This document and the verified screenshots are the handoff source for a future editable file.

## Suggested page structure

1. `00 Cover`
2. `01 Foundations`
3. `02 Components`
4. `03 Desktop`
5. `04 Tablet`
6. `05 Mobile`
7. `06 Flows`
8. `07 Prototype notes`

## Frames

| Frame | Suggested size | Source |
|---|---:|---|
| Discovery / desktop | 1440 × 1024 | `assets/home-desktop.png` |
| Map exploration / desktop | 1440 × 1024 | `assets/map-desktop.png` |
| Discovery / mobile | 390 × 844 | `assets/home-mobile.png` |
| Authentication / mobile | 390 × 844 | `assets/login-mobile.png` |
| Popup detail sheet | 390 × 844 | current `PopupStoreDetails` implementation |
| Route planner sheet | 390 × 844 | current `RoutePlanner` implementation |
| Navigation active | 390 × 844 | current `NavigationPanel` implementation |
| My page drawer | 390 × 844 | current `MyPageDrawer` implementation |

## Components and variants

- Header: desktop/mobile, menu open/closed, authenticated/anonymous
- Search: idle/focused/loading/results/empty/error
- Category chip: default/hover/selected/focus
- Popup card: open/upcoming/closed, selected/unselected, favorited/unfavorited
- Marker: default/active/sequence/current stop/next stop
- GPS FAB: locate/follow/heading-follow/error
- Sheet: collapsed/expanded/loading/error
- Auth field: idle/focus/error/disabled
- Route list item: default/dragging/first/last
- Navigation card: calculating/active/rerouting/arrived/error

## Prototype flows

1. Search or category filter → open popup detail.
2. Add two or more popups → optionally reorder/optimize → start walking guidance.
3. Locate → follow → heading-follow.
4. Anonymous account menu → login/sign-up → favorite/visit/review.
5. My page → favorites/visits/my reviews.

## Handoff constraints

- Do not replace OpenLayers interaction with a static mock.
- Preserve semantic names and keyboard map selector.
- Retain mobile safe-area spacing.
- Keep all GPS states and errors represented; geolocation is not guaranteed.
- Label development seed content as sample data.

# Figma UI Specification

## Availability note

The connected account reports a `View` seat, but creating and editing a new draft file was available and verified during the follow-up pass.

[Open the editable Popup Store Map Figma file](https://www.figma.com/design/aPPGnSFCyHihzF53uTCaOT)

The starter workspace permits three pages in this file. The implemented structure therefore groups related presentation frames without removing any source screen:

1. `01 Cover`
2. `02 Design System`
3. `03 Desktop`
   - Captured full application
   - `04 Map & Route / Presentation`
   - `05 Mobile / Responsive Experience`

The design-system page contains editable color swatches, typography, button, chip, search-input, and popup-card elements. The screen frames use verified implementation captures rather than invented product states.

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

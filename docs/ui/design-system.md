# UI Design System

This is an implementation-oriented specification of the current interface, not a claim of a published Figma library.

## Principles

1. **Discovery first** — popup cards and map are peers, not separate products.
2. **One continuous task** — discovery, schedule selection, route calculation and navigation stay in one page flow.
3. **Progressive disclosure** — detail, account and navigation information appears in sheets/drawers when needed.
4. **Map-safe controls** — floating controls avoid marker and attribution regions and remain keyboard operable.
5. **Mobile parity** — narrow screens retain search, selection, route and account capabilities.

## Visual tokens

| Token | Intent |
|---|---|
| Coral accent | primary actions, selected filters and active states |
| Navy ink | headings, route/navigation emphasis |
| Blue location | GPS marker, heading and follow state |
| Neutral surface | cards, sheets, menus and form fields |
| Muted text | metadata and secondary explanations |
| 12–24px radius | cards, sheets and interactive surfaces |
| 150–250ms motion | fade, slide, scale and control-state transitions |

The implementation keeps colors and spacing as CSS custom properties where shared behavior is required. New tokens should be introduced only when at least two components consume them.

## Component patterns

- **Popup card:** status/category → title → period/location → engagement/actions.
- **Floating search:** visible label for assistive technology, clear focus ring, results dropdown.
- **Map marker:** default, selected sequence, current stop and next stop states.
- **Bottom sheet:** close control, focusable content, responsive height, safe-area padding.
- **FAB stack:** GPS state, north-up and rotation actions with accessible names.
- **Route chip/list:** stable popup id key, order indicator, reorder/remove actions.
- **Feedback:** user-safe error message, loading disablement and stale-route notice.

## Responsive behavior

- Desktop uses horizontal discovery sections and side-by-side map/content where space permits.
- Tablet reduces columns while preserving panel hierarchy.
- Mobile uses scrollable card rails and bottom sheets; tap targets remain at least approximately 44px.
- `env(safe-area-inset-*)` is applied to fixed mobile controls and sheets.

## Accessibility checklist

- Prefer semantic `button`, `dialog`, `navigation`, `article` and form labels.
- Keep keyboard alternatives for map marker selection.
- Announce selected/pressed state and disabled route actions.
- Never rely on marker color alone for sequence or current/next stop.
- Restore focus after closing modal/sheet flows.
- Respect reduced-motion preferences for pulse, scale and map transition effects.

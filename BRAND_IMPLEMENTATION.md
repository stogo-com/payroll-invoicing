# Brand Implementation Guide

## Typography
- **Primary Font**: Montserrat (already configured in `app/layout.tsx`)
- **Main Headings (H1)**: 28px, font-weight 600 (semibold), letter-spacing -0.02em
- **Secondary Headings (H2)**: 24px, font-weight 600
- **Tertiary Headings (H3)**: 20px, font-weight 600
- **Quaternary Headings (H4)**: 18px, font-weight 500

## Logo/Brandmark
- **Location**: 
  - Sidebar header (80x80px)
  - Top bar next to page title (32x32px)
  - Favicon (via metadata)
- **File**: `/public/stogomark.png`

## Brand Colors
**Note**: Brand colors were mentioned but not provided. Please update the following CSS variables in `app/globals.css`:

### Current Color Scheme (to be updated with brand colors):
- Primary: `oklch(0.55 0.15 270)` - Purple-blue (#6969f5)
- Secondary: `oklch(0.45 0 0)` - Medium gray (#6a6a6a)
- Background: Light/Dark mode variants

### To Update Brand Colors:
1. Replace color values in `:root` (light mode) section
2. Replace color values in `.dark` (dark mode) section
3. Update primary, secondary, accent, and other brand-specific colors

## Implementation Status
✅ Typography (Montserrat 28px for H1)
✅ Logo placement (Sidebar + Top Bar)
✅ Favicon configuration
⏳ Brand colors (awaiting color values)

## Next Steps
1. Provide brand color palette (hex codes or color names)
2. Update CSS variables in `app/globals.css`
3. Test color contrast and accessibility
4. Apply brand colors to key UI elements (buttons, links, accents)


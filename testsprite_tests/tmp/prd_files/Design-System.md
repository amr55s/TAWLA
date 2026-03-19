# Design System & UI/UX Guidelines

## Design Philosophy
The UI must reflect calmness, simplicity, and a modern "Gulf Style" aesthetic. This means:
- **High Negative Space:** Generous padding and margins. No cluttered interfaces.
- **Photography-First:** UI elements should act as a subtle frame for high-quality food photography.
- **Minimalist Cards:** Clean borders, very soft shadows, or flat design.

## Typography
- **Arabic Font:** `Tajawal` or `Cairo` (Clean, modern Kufic-inspired sans-serif).
- **English Font:** `Inter` or `Outfit`.
- **Hierarchy:** Clear distinction between Headings (Dish titles) and Body text (Descriptions).

## Color Theming (Multi-tenant approach)
Colors will be injected via the database per restaurant, but the fallback structure is:
- `--primary`: The main brand color (e.g., for "Add to Cart" buttons).
- `--secondary`: For subtle highlights.
- `--background`: Strictly off-white or very light gray (e.g., `#FAFAFA`) to maintain a clean look.
- `--text-main`: Dark gray/charcoal (not pure black) for softer readability.

## Components & Interactions
- **Bottom Sheets:** Use instead of traditional modals for Cross-selling pop-ups to ensure one-handed mobile usage.
- **Framer Motion Animations:**
  - Page transitions: Soft fade-in.
  - Button taps: `whileTap={{ scale: 0.97 }}`.
  - Adding to cart: Subtle bounce or slide-up toast notification.
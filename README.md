# ASG — Al Sharif Group Holding · Landing demo

A single-page, bilingual (English / Arabic) landing experience for Al Sharif Group Holding, built to the Sky Re benchmark. Plain HTML, CSS and JS; no build step.

## Run

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 5180
```

`?lang=ar` opens the Arabic (RTL) version and `?theme=light` the light version; both choices are remembered per browser. The sun/moon button in the header switches theme with a circular reveal (View Transitions, where supported).

## Stack

| Piece | Use |
| --- | --- |
| GSAP 3.13 + ScrollTrigger | Reveals, split-word headings, pinned sectors rail, counters, parallax |
| Lenis | Smooth scrolling |
| Inline SVG + GSAP | Hero globe — the exact ASG mark, vector-traced from the official logo (`assets/js/mark-paths.js`): an energy core ignites, the grid lines draw the sphere, the ribbons swirl in and lock into place, then three depth layers turn with the pointer while a light sweep and current run across it |
| YouTube (privacy-enhanced `youtube-nocookie.com`) | The ASG film from the current home page (`gRiefDzSF2M`). On desktop it plays muted behind the site's own captions, opening from a framed window to full-bleed on scroll; "Watch the film" opens it with sound. Phones show the film still and open the player on tap. It loads only when the section approaches and pauses off-screen |
| Canvas 2D | "Plant to plug" energy-grid animation, revenue sparkline |
| Inline SVG | Saudi Arabia project map (Natural Earth outlines, public domain) |
| Readex Pro + Instrument Serif | Google Fonts. Readex covers Latin and Arabic in one family; Instrument Serif italic is the English accent |

Vendored libraries are in `assets/vendor/` (copied from the Sky Re build).

## Files

- `index.html` — markup; every string carries a `data-i18n` key
- `assets/js/content.js` — all copy (EN + AR) and data: sectors, grid stages, transmission lines, map projects, offices, executives, news
- `assets/js/app.js` — language engine, loader, scroll choreography, map, grid canvas, cursor, clocks
- `assets/js/globe.js` — hero globe formation and motion
- `assets/js/mark-paths.js` — the traced ASG mark: 35 ribbon pieces and 67 grid-line pieces in the logo's five colours
- `assets/css/style.css` — design tokens at the top; RTL handled with logical properties plus `html[dir="rtl"]` overrides
- `assets/css/theme.css` — light theme: token swap on `html[data-theme="light"]`; photo cards, region panels and the film stay dark "islands"

## Brand

Colours are sampled from the ASG globe mark: amber `#F39019`, gold `#C9962A`, sand `#F0D38F`, taupe `#A8987F`, steel `#7A7A7D`. The five-colour bar (gold, red, blue, purple, green) comes from the current site's sector colour lines. Sector accents follow each company mark (ASC amber, ASH gold, ASI blue, ASX purple, ASD green, MADAN red).

`assets/img/brand/asg-lockup-dark.png` and `asg-lockup.png` are rebuilt from the site's logo: the globe uses the high-resolution mark from the site and the wordmark is cleaned to a transparent background. For production, replace them with the official vector logo.

## Sources

- **Content, figures, logos, project, CSR, leadership and executive-team photos** — alsharifgroup.com (EN and AR).
- **Atmosphere photos** (Unsplash licence): Nile felucca (Crankylama), Riyadh dusk (Ibrahim Abdullah), Riyadh night (سيف الظاهر), solar field (Manny Becerra), desert power lines (Intricate Explorer), desert (NEOM).

## To confirm with ASG

- The CEO portrait (`people/ceo.jpg`) is the image the current About page shows beside the CEO's message. Confirm it before sharing.
- Completed projects: the English site says 211 and the Arabic site says 144. The demo uses 211 in both languages.
- The contact form is a demo and sends nothing.

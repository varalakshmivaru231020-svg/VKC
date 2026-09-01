# VKC Gold — Full-Stack E-Commerce Development Plan
> Reference: Taneira.com (Tata luxury saree brand) — Goal: Superior design, better UX, richer saree-specific features
> Stack: Next.js 14 · Node.js · PostgreSQL · Flutter

---

## 1. TANEIRA REFERENCE ANALYSIS

### What Taneira Does Well
- Heritage-inspired editorial layout with large product photography
- Clean category navigation with regional saree classification
- Minimal clutter on product detail pages

### Taneira's Weaknesses (We Improve On)
- Mobile experience feels like a scaled-down desktop (we build mobile-first)
- Limited color variant visualization (we build immersive swatch system)
- Slow page transitions (we use Next.js App Router + streaming)
- Generic checkout flow (we build a guided, warm, branded checkout)
- No barcode / inventory code visibility for staff/admin use cases
- No per-color pricing differentiation
- Product cards feel dated — low information density
- Search is basic (we add smart filters: weave, occasion, price, fabric, region)

---

## 2. DESIGN SYSTEM (CENTRALIZED — Single Source of Truth)

All colors, fonts, spacing, and components are defined once and consumed everywhere — both web (CSS custom properties + Tailwind) and mobile (Flutter ThemeData).

### 2.1 Color Palette

```
// BRAND COLORS
--color-primary:         #8B1A2E   (Deep Rani Crimson)
--color-primary-dark:    #5E1020   (Night Crimson)
--color-primary-light:   #B5293F   (Vivid Crimson)
--color-primary-50:      #FDF0F2   (Blush Tint — hover backgrounds)

// GOLD ACCENTS
--color-gold:            #C4922A   (Warm Antique Gold)
--color-gold-light:      #E8C97A   (Pale Gold — borders, shimmer)
--color-gold-dark:       #8B6318   (Deep Gold — text on light gold)

// NEUTRALS
--color-ivory:           #FBF8F3   (Page Background — warm white)
--color-cream:           #F2EBE0   (Section Background)
--color-parchment:       #E8DDD0   (Card Borders, Dividers)
--color-sand:            #C9BAA8   (Muted Borders)

// TEXT
--color-text-primary:    #1C1410   (Near Black — warm toned)
--color-text-secondary:  #4A3F38   (Dark Brown — body copy)
--color-text-muted:      #8A7B72   (Captions, labels)
--color-text-disabled:   #BEB3AC   (Disabled states)
--color-text-inverse:    #FBF8F3   (Text on dark backgrounds)

// SEMANTIC
--color-success:         #2E6B47   (Deep Forest Green)
--color-success-bg:      #EDF7F2
--color-error:           #C42B2B
--color-error-bg:        #FEF0F0
--color-warning:         #C47A2B
--color-warning-bg:      #FEF5E7
--color-info:            #1B4B6B

// SPECIAL SAREE SWATCHES OVERLAY
--color-swatch-border:   #C4922A   (Selected swatch gold ring)
--color-badge-new:       #1B4B6B   (New arrival badge)
--color-badge-sale:      #C42B2B   (Sale badge)
--color-badge-exclusive: #8B1A2E   (Exclusive badge)
```

### 2.2 Typography

**Web Fonts (Google Fonts)**
```
Primary Display:  "Cormorant Garamond" — weights 300, 400, 500, 600, 700 (ultra-elegant serif)
Secondary Display: "Playfair Display"  — weights 400, 700 (editorial headings)
Body / UI:        "Inter"             — weights 300, 400, 500, 600 (clean sans-serif)
Price / Numbers:  "Cormorant Garamond" Italic — tabular figures
```

**Flutter (Mobile)**
```
GoogleFonts.cormorantGaramond() — headings, product names, hero text
GoogleFonts.inter()            — body, buttons, labels, navigation
```

**Type Scale**
```
Display XL:   clamp(56px, 7vw, 96px)  / weight 300 / Cormorant Garamond
Display:      clamp(40px, 5vw, 72px)  / weight 400 / Cormorant Garamond
H1:           clamp(32px, 4vw, 52px)  / weight 500 / Cormorant Garamond
H2:           clamp(26px, 3vw, 40px)  / weight 500 / Cormorant Garamond
H3:           28px                    / weight 600 / Cormorant Garamond
H4:           22px                    / weight 600 / Inter
H5:           18px                    / weight 600 / Inter
Body XL:      20px                    / weight 400 / Inter
Body:         16px                    / weight 400 / Inter
Body SM:      14px                    / weight 400 / Inter
Caption:      12px                    / weight 500 / Inter (uppercase + tracked)
Price:        24px                    / weight 500 / Cormorant Garamond Italic
Price SM:     18px                    / weight 500 / Cormorant Garamond Italic
Label:        11px                    / weight 600 / Inter (uppercase, letter-spacing: 1.5px)
```

### 2.3 Spacing System (4px base)
```
space-1:   4px     space-6:  24px    space-12:  48px
space-2:   8px     space-7:  28px    space-14:  56px
space-3:  12px     space-8:  32px    space-16:  64px
space-4:  16px     space-9:  36px    space-20:  80px
space-5:  20px     space-10: 40px    space-24:  96px
                                     space-32: 128px
```

### 2.4 Border Radius
```
radius-xs:   2px   (tags, badges)
radius-sm:   4px   (inputs, buttons)
radius-md:   8px   (cards, modals)
radius-lg:  12px   (large cards, drawers)
radius-xl:  20px   (hero cards, feature blocks)
radius-full: 9999px (pills, avatars, swatches)
```

### 2.5 Shadows (Warm-toned)
```
shadow-xs:  0 1px 3px rgba(28, 20, 16, 0.06)
shadow-sm:  0 2px 8px rgba(28, 20, 16, 0.08)
shadow-md:  0 4px 16px rgba(28, 20, 16, 0.10)
shadow-lg:  0 8px 32px rgba(28, 20, 16, 0.12)
shadow-xl:  0 16px 48px rgba(28, 20, 16, 0.15)
shadow-gold: 0 0 0 2px #C4922A        (selected state glow)
```

### 2.6 Motion / Animation Tokens
```
duration-fast:    150ms
duration-normal:  250ms
duration-slow:    400ms
duration-slower:  600ms
easing-default:   cubic-bezier(0.4, 0, 0.2, 1)
easing-enter:     cubic-bezier(0.0, 0, 0.2, 1)
easing-exit:      cubic-bezier(0.4, 0, 1, 1)
easing-spring:    cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## 3. TECH STACK

### 3.1 Web Platform
```
Framework:        Next.js 14 (App Router, RSC, Server Actions)
Language:         TypeScript 5
Styling:          Tailwind CSS 3 + CSS custom properties (design tokens)
UI Components:    Radix UI primitives + custom design system components
State:            Zustand (client) + TanStack Query (server cache)
Forms:            React Hook Form + Zod validation
Auth:             NextAuth.js v5 (credentials + Google + OTP via SMS)
ORM:              Prisma 5
Database:         PostgreSQL 16
File Storage:     Cloudinary (images + video) or AWS S3
Search:           PostgreSQL full-text search + pg_trgm (upgrade to Algolia later)
Email:            Resend + React Email templates
SMS/OTP:          Twilio / MSG91 (India)
Payments:         Razorpay (primary, India) + Stripe (international)
Deployment:       Vercel (web) + Railway/Supabase (PostgreSQL)
Cache:            Redis (sessions, cart, rate limits) via Upstash
Analytics:        Posthog (self-hosted optional)
CDN:              Cloudflare
```

### 3.2 Mobile App (Flutter)
```
Framework:        Flutter 3.x (Dart)
State:            Riverpod 2 (flutter_riverpod)
Navigation:       GoRouter
HTTP:             Dio + Retrofit
Local Storage:    Hive + Flutter Secure Storage (tokens)
Images:           Cached Network Image + flutter_blurhash
Payments:         Razorpay Flutter SDK
Auth:             JWT + Biometric (local_auth)
Push Notifs:      Firebase Cloud Messaging (FCM)
Analytics:        Firebase Analytics
Crash Reporting:  Firebase Crashlytics
Deep Links:       uni_links
Share:            share_plus
Barcode Scan:     mobile_scanner (staff app)
Fonts:            Google Fonts package
```

### 3.3 Backend / API
```
API Style:         REST (Next.js API Routes) — primary
Runtime:           Node.js 20 (Edge Runtime for critical paths)
Validation:        Zod
Rate Limiting:     Upstash Redis
Background Jobs:   inngest or BullMQ (order notifications, email)
Logging:           Pino
```

---

## 4. DATABASE SCHEMA (PostgreSQL + Prisma)

### 4.1 Core Product Schema (Saree-specific)

```sql
-- CATEGORIES
Table: categories
  id            UUID PK
  name          VARCHAR(100)
  slug          VARCHAR(100) UNIQUE
  parent_id     UUID FK categories(id)  -- for nested: Silk > Kanjivaram
  description   TEXT
  image_url     VARCHAR(500)
  sort_order    INT DEFAULT 0
  is_active     BOOLEAN DEFAULT true
  created_at    TIMESTAMP
  updated_at    TIMESTAMP

-- SAREE PRODUCTS (master record)
Table: products
  id              UUID PK
  name            VARCHAR(300)          -- "Kanjivaram Pure Silk Saree"
  slug            VARCHAR(300) UNIQUE
  description     TEXT                  -- rich text / markdown
  short_desc      VARCHAR(500)
  category_id     UUID FK categories(id)
  fabric          VARCHAR(100)          -- Silk, Cotton, Georgette, etc.
  weave_type      VARCHAR(100)          -- Kanjivaram, Banarasi, Patola, etc.
  occasion        VARCHAR[] / JSONB     -- ["Wedding", "Festival", "Casual"]
  region_of_origin VARCHAR(100)         -- Tamil Nadu, Varanasi, Gujarat
  blouse_piece    BOOLEAN DEFAULT false -- comes with blouse piece?
  blouse_length_cm INT                  -- blouse piece length
  saree_length_cm INT DEFAULT 560       -- standard 5.6m
  care_instructions TEXT
  weight_gm       INT                   -- for shipping calc
  is_active       BOOLEAN DEFAULT true
  is_featured     BOOLEAN DEFAULT false
  meta_title      VARCHAR(200)
  meta_description VARCHAR(400)
  tags            TEXT[]
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

-- SAREE COLOR VARIANTS (the core variant model)
Table: product_variants
  id              UUID PK
  product_id      UUID FK products(id) ON DELETE CASCADE
  color_name      VARCHAR(100)         -- "Royal Blue", "Peacock Green"
  color_hex       VARCHAR(7)           -- #1B4B6B (for swatch display)
  color_hex_2     VARCHAR(7)           -- optional second hex (for dual-tone)
  saree_code      VARCHAR(50) UNIQUE NULL  -- optional SKU per color e.g. "VL-KNJ-001-RB"
  barcode         VARCHAR(100) UNIQUE NULL -- optional EAN/barcode per color
  cost_price      DECIMAL(10,2)        -- purchase/manufacturing cost
  sale_price      DECIMAL(10,2)        -- current selling price
  original_price  DECIMAL(10,2)        -- MRP / strikethrough price
  stock_qty       INT DEFAULT 0
  reserved_qty    INT DEFAULT 0        -- held in active carts
  is_active       BOOLEAN DEFAULT true
  sort_order      INT DEFAULT 0
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

-- PRODUCT IMAGES (per variant)
Table: product_images
  id              UUID PK
  product_id      UUID FK products(id)
  variant_id      UUID FK product_variants(id) NULL  -- null = general product image
  url             VARCHAR(500)
  alt_text        VARCHAR(200)
  sort_order      INT DEFAULT 0
  is_primary      BOOLEAN DEFAULT false
  width           INT
  height          INT
  blur_hash       VARCHAR(100)         -- for placeholder loading

-- USERS
Table: users
  id              UUID PK
  email           VARCHAR(255) UNIQUE NOT NULL
  phone           VARCHAR(20) UNIQUE
  password_hash   VARCHAR(255)         -- null for social logins
  first_name      VARCHAR(100)
  last_name       VARCHAR(100)
  avatar_url      VARCHAR(500)
  role            ENUM('customer','admin','staff')  DEFAULT 'customer'
  email_verified  BOOLEAN DEFAULT false
  phone_verified  BOOLEAN DEFAULT false
  is_active       BOOLEAN DEFAULT true
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

-- ADDRESSES
Table: addresses
  id              UUID PK
  user_id         UUID FK users(id)
  label           VARCHAR(50)          -- "Home", "Office"
  full_name       VARCHAR(200)
  phone           VARCHAR(20)
  address_line1   VARCHAR(300)
  address_line2   VARCHAR(300)
  city            VARCHAR(100)
  state           VARCHAR(100)
  pincode         VARCHAR(10)
  country         VARCHAR(50) DEFAULT 'India'
  is_default      BOOLEAN DEFAULT false
  created_at      TIMESTAMP

-- ORDERS
Table: orders
  id              UUID PK
  order_number    VARCHAR(20) UNIQUE    -- VL-20260001
  user_id         UUID FK users(id)
  status          ENUM('pending','confirmed','processing','shipped','delivered','cancelled','refunded')
  payment_status  ENUM('pending','paid','failed','refunded','partially_refunded')
  payment_method  VARCHAR(50)
  payment_id      VARCHAR(100)          -- Razorpay payment ID
  subtotal        DECIMAL(10,2)
  discount_amount DECIMAL(10,2) DEFAULT 0
  shipping_amount DECIMAL(10,2) DEFAULT 0
  tax_amount      DECIMAL(10,2) DEFAULT 0
  total_amount    DECIMAL(10,2)
  coupon_code     VARCHAR(50)
  shipping_address JSONB
  billing_address  JSONB
  notes           TEXT
  tracking_number VARCHAR(100)
  shipped_at      TIMESTAMP
  delivered_at    TIMESTAMP
  cancelled_at    TIMESTAMP
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

-- ORDER ITEMS
Table: order_items
  id              UUID PK
  order_id        UUID FK orders(id)
  product_id      UUID FK products(id)
  variant_id      UUID FK product_variants(id)
  product_name    VARCHAR(300)         -- snapshot at purchase time
  variant_color   VARCHAR(100)         -- snapshot
  saree_code      VARCHAR(50)          -- snapshot
  quantity        INT
  unit_price      DECIMAL(10,2)
  total_price     DECIMAL(10,2)
  image_url       VARCHAR(500)

-- CART
Table: carts
  id              UUID PK
  user_id         UUID FK users(id) NULL  -- null for guest
  session_id      VARCHAR(100)            -- guest identifier
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

Table: cart_items
  id              UUID PK
  cart_id         UUID FK carts(id)
  product_id      UUID FK products(id)
  variant_id      UUID FK product_variants(id)
  quantity        INT DEFAULT 1
  added_at        TIMESTAMP

-- WISHLISTS
Table: wishlists
  id              UUID PK
  user_id         UUID FK users(id)
  variant_id      UUID FK product_variants(id)
  added_at        TIMESTAMP
  UNIQUE(user_id, variant_id)

-- COUPONS
Table: coupons
  id              UUID PK
  code            VARCHAR(50) UNIQUE
  type            ENUM('percentage','fixed','free_shipping')
  value           DECIMAL(10,2)
  min_order_amount DECIMAL(10,2)
  max_discount    DECIMAL(10,2)
  usage_limit     INT
  used_count      INT DEFAULT 0
  starts_at       TIMESTAMP
  expires_at      TIMESTAMP
  is_active       BOOLEAN DEFAULT true

-- REVIEWS
Table: reviews
  id              UUID PK
  product_id      UUID FK products(id)
  user_id         UUID FK users(id)
  order_item_id   UUID FK order_items(id)  -- only verified buyers
  rating          INT CHECK(rating BETWEEN 1 AND 5)
  title           VARCHAR(200)
  body            TEXT
  images          TEXT[]
  is_approved     BOOLEAN DEFAULT false
  created_at      TIMESTAMP

-- BANNERS / CMS
Table: banners
  id              UUID PK
  title           VARCHAR(200)
  subtitle        VARCHAR(400)
  image_url       VARCHAR(500)
  mobile_image_url VARCHAR(500)
  link_url        VARCHAR(500)
  position        VARCHAR(50)          -- 'hero', 'mid-banner', 'category-top'
  sort_order      INT
  is_active       BOOLEAN
  starts_at       TIMESTAMP
  ends_at         TIMESTAMP
```

---

## 5. PROJECT STRUCTURE

### 5.1 Web (Next.js)
```
vkcgold-web/
├── app/
│   ├── (marketing)/          # Public pages (no auth required)
│   │   ├── page.tsx          # Home
│   │   ├── shop/
│   │   │   ├── page.tsx      # Shop listing
│   │   │   └── [slug]/       # Product detail
│   │   ├── category/
│   │   │   └── [slug]/       # Category page
│   │   ├── search/           # Search results
│   │   ├── about/
│   │   └── contact/
│   ├── (checkout)/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── order-confirmation/[id]/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (account)/            # Protected account pages
│   │   ├── dashboard/
│   │   ├── orders/
│   │   │   └── [id]/
│   │   ├── wishlist/
│   │   ├── addresses/
│   │   └── profile/
│   ├── (admin)/              # Admin panel
│   │   ├── dashboard/
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/edit/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── categories/
│   │   ├── coupons/
│   │   └── reports/
│   ├── api/
│   │   ├── auth/[...nextauth]/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── users/
│   │   ├── upload/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                   # Base design system components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Badge/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Drawer/
│   │   ├── Toast/
│   │   ├── Skeleton/
│   │   ├── Tabs/
│   │   └── ...
│   ├── product/
│   │   ├── ProductCard/
│   │   ├── ProductGrid/
│   │   ├── ProductGallery/
│   │   ├── ColorSwatches/
│   │   ├── PriceDisplay/
│   │   └── SareeCodeBadge/
│   ├── layout/
│   │   ├── Header/
│   │   ├── Footer/
│   │   ├── MobileNav/
│   │   └── Breadcrumb/
│   ├── cart/
│   ├── checkout/
│   └── account/
│
├── lib/
│   ├── db/                   # Prisma client + queries
│   ├── auth/                 # Auth helpers
│   ├── payments/             # Razorpay integration
│   ├── storage/              # Cloudinary helpers
│   ├── email/                # Resend + React Email
│   ├── utils/
│   └── validations/          # Zod schemas
│
├── styles/
│   ├── tokens.css            # Design tokens (CSS custom props)
│   └── typography.css
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
└── public/
    └── fonts/
```

### 5.2 Mobile (Flutter)
```
vijaylakshmi-app/
├── lib/
│   ├── core/
│   │   ├── theme/
│   │   │   ├── app_theme.dart        # ThemeData — single source of truth
│   │   │   ├── app_colors.dart       # All color constants
│   │   │   ├── app_typography.dart   # TextTheme
│   │   │   └── app_spacing.dart      # EdgeInsets constants
│   │   ├── router/
│   │   │   └── app_router.dart       # GoRouter config
│   │   ├── network/
│   │   │   ├── dio_client.dart
│   │   │   └── api_endpoints.dart
│   │   └── utils/
│   │
│   ├── features/
│   │   ├── home/
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   │       ├── home_screen.dart
│   │   │       ├── widgets/
│   │   │       │   ├── hero_carousel.dart
│   │   │       │   ├── category_row.dart
│   │   │       │   ├── featured_sarees.dart
│   │   │       │   └── editorial_banner.dart
│   │   ├── shop/
│   │   │   └── presentation/
│   │   │       ├── shop_screen.dart
│   │   │       ├── filter_bottom_sheet.dart
│   │   │       └── widgets/
│   │   │           └── saree_card.dart
│   │   ├── product_detail/
│   │   │   └── presentation/
│   │   │       ├── product_detail_screen.dart
│   │   │       └── widgets/
│   │   │           ├── image_gallery.dart
│   │   │           ├── color_swatch_row.dart
│   │   │           ├── price_section.dart
│   │   │           └── details_accordion.dart
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── wishlist/
│   │   ├── auth/
│   │   └── profile/
│   │
│   └── main.dart
```

---

## 6. PAGE-BY-PAGE DESIGN SPECIFICATIONS

### PAGE 1: HOME PAGE

**Layout Structure:**
```
[ANNOUNCEMENT BAR]     — "Free shipping above ₹2999 | New Arrivals: Kanjivaram Collection"
                         Background: #8B1A2E, text: #E8C97A, 40px height

[HEADER - Sticky]      — Height: 72px desktop / 64px mobile
  Logo (left)          — Wordmark "VKC Gold" in Cormorant Garamond 28px gold
  Nav (center)         — New Arrivals | Collections | Shop | Our Story | Contact
  Icons (right)        — Search | Wishlist (count) | Cart (count) | Account

[HERO — Full Viewport]
  Autoplay carousel (3 slides, 5s interval, fade transition)
  Slide layout: Full bleed image (right 60%) + text block (left 40%)
  Text: Display XL headline + body + 2 CTAs (primary + outlined)
  Overlay: Subtle warm gradient left-to-right
  Indicator: Thin gold line progress bar at bottom
  Mobile: Image fills full screen, text overlays bottom with blur backdrop

[CATEGORY STRIPS — "Shop by Occasion"]
  Horizontal scroll on mobile, 5-column grid desktop
  Cards: Circular image 120px + label below
  Occasions: Wedding | Festival | Party | Daily | Office

[EDITORIAL FEATURE — "The Kanjivaram Story"]
  Two-panel: Large image (left 55%) + story text (right 45%)
  Background: --color-cream
  Includes: Heritage narrative + link to collection
  Visual treatment: Subtle border-top in gold

[FEATURED COLLECTIONS — Grid]
  Section header: "New Arrivals" with "View All →" link
  Layout: 4-column desktop, 2-column tablet, 1.5-column scroll mobile
  Product cards (see card spec below)

[REGIONAL COLLECTIONS BANNER]
  3 horizontal bento-style cards: Kanjivaram | Banarasi | Patola
  Each: Full bleed background image + overlay text + CTA
  Height: 420px desktop / 200px mobile

[BESTSELLERS CAROUSEL]
  Heading: "Our Most Loved Sarees"
  Horizontal scroll carousel with 4 visible cards
  Auto-scroll on desktop hover pause

[TRUST BADGES]
  4-column: Pure Fabrics | Free Returns | Secure Payment | Expert Care
  Icon: Gold illustrated icon + heading + 1-line desc

[EDITORIAL — "How to Drape"]
  Video thumbnail (YouTube embed) or image + play button
  2-column with text description

[RECENTLY VIEWED] (personalized, shows after first browse)

[FOOTER]
  4-column: Brand story | Shop links | Help | Connect
  Newsletter signup bar (Cormorant heading + Inter input)
  Payment icons row
  Copyright + policy links
```

**Product Card (reused across all pages):**
```
Width: auto (grid responsive)
Aspect ratio: 3:4 (portrait — ideal for sarees)
Image: object-fit cover, lazy loaded, blurhash placeholder
Top-right: Wishlist heart (ghost button, fills on active)
Top-left: Badge (NEW / SALE / EXCLUSIVE) — pill, color coded
Below image:
  Color swatches row (max 5 visible + "+N more" chip)
  Product name — H5 Inter 600, 2-line clamp
  Fabric + weave — Caption, muted text
  Price row: Sale price (Cormorant 20px #8B1A2E) | Original (14px strikethrough)
  Saree code — if present: small monospace badge in bottom-right
On hover (desktop): Second image crossfades + "Quick View" button slides up
```

---

### PAGE 2: CATEGORY / COLLECTION PAGE

**URL Pattern:** `/category/kanjivaram-sarees`

**Layout:**
```
[BREADCRUMB]         Home › Silk Sarees › Kanjivaram

[CATEGORY HERO]      Full-width, 320px height
                     Background image with text overlay
                     Title: H1 Cormorant + short description

[FILTER + RESULTS BAR]   Sticky at top on scroll
  Left: "124 Sarees" count
  Right: Sort dropdown + Filter toggle button

[FILTER SIDEBAR] (desktop: 260px left panel | mobile: bottom sheet)
  Price Range:     Slider + manual input (₹ min — ₹ max)
  Color:           Color swatch grid (visual dot selectors)
  Fabric:          Checkbox list (Silk, Cotton, Georgette...)
  Occasion:        Checkbox list
  Region:          Checkbox list
  Weave Type:      Checkbox list
  Blouse Piece:    Toggle
  In Stock Only:   Toggle
  [Clear All] [Apply Filters] CTA

[PRODUCT GRID]
  Desktop: 3 columns
  Tablet: 2 columns
  Mobile: 2 columns (compact cards)
  Infinite scroll OR "Load More" button (prefer Load More for SEO)

[EMPTY STATE]
  Illustrated graphic + "No sarees found for these filters" + Clear Filters CTA
```

---

### PAGE 3: PRODUCT DETAIL PAGE

**URL Pattern:** `/shop/kanjivaram-pure-silk-saree-royal-blue`

**Layout (Desktop: Two-column | Mobile: Single scroll)**
```
[LEFT COLUMN — 55% — Image Gallery]
  Main image: Large, 600px, zoomable on hover
  Thumbnail strip: Vertical, 5 images, scrollable
  Image tabs: By color variant (switching color changes image set)
  Video: If present, plays inline (muted autoplay loop)
  Zoom: CSS zoom on hover / pinch on mobile

[RIGHT COLUMN — 45% — Product Info]

  Breadcrumb (small, muted)

  [BADGES ROW]     NEW | PURE SILK | HANDWOVEN  (pill chips)

  [PRODUCT NAME]   H1 Cormorant — "Kanjivaram Pure Silk Saree"

  [RATING ROW]     ★★★★☆ 4.2 (38 reviews) — links to reviews section

  [PRICE SECTION]
    Current color: "Royal Blue"
    Sale: ₹18,500  (Cormorant 28px #8B1A2E)
    MRP: ₹22,000 (strikethrough, muted)
    Savings: "Save ₹3,500 (16% off)" — success green pill badge
    GST: "Inclusive of all taxes"

  [SAREE CODE / BARCODE]
    Saree Code: VL-KNJ-001  (shown if present)
    Small info tooltip explaining what saree code is

  [COLOR SELECTION]
    Label: "Colour — Royal Blue"  (updates dynamically)
    Swatch grid: Circle swatches 40px, gold ring on selected
    Each swatch: color hex dot + tooltip with color name on hover
    Out-of-stock swatches: crossed-out line through them
    Show count: "5 colours available"

  [STOCK INDICATOR]
    If stock ≤ 3: "Only 2 left in this colour!" (warning amber)
    If in stock: "In Stock" (success green)
    If out of stock: "Out of Stock — Notify Me" (with email input)

  [ADD TO CART / WISHLIST]
    Primary button: "Add to Cart" — full width, #8B1A2E, 52px height
    Secondary: "Add to Wishlist" — outlined, heart icon
    One-click buy: "Buy Now" — gold filled button

  [DELIVERY INFO]
    Pincode check: Input + "Check" CTA
    Result: "Delivery by Fri, 29 Apr · Free"
    Returns: "Easy 15-day returns"

  [DETAILS ACCORDION]
    • Product Details (fabric, weave, blouse, length, weight)
    • Care Instructions
    • Shipping & Returns
    • Size Guide (saree draping guide)

[FULL WIDTH BELOW]

  [PRODUCT STORY / CRAFTSMANSHIP]
    2-column: Image (weaver at loom) + narrative text
    Visual: Background --color-cream, generous padding

  [HOW TO STYLE — Editorial]
    3 look cards showing the saree styled differently

  [REVIEWS SECTION]
    Rating summary bar chart
    Review cards with user photo + verified purchase badge
    Write a Review CTA (only for verified buyers)

  [RECENTLY VIEWED]

  [SIMILAR SAREES]
    6-product carousel
```

---

### PAGE 4: CART PAGE

```
[CART LAYOUT — 2 column desktop, stacked mobile]

LEFT (65%):
  Header: "Your Cart (3 items)"

  [CART ITEM CARD] (one per item)
    Image: 100px × 130px (3:4 ratio)
    Product name + color + saree code (if present)
    Price (current) + original
    Qty stepper: — 1 + (disabled at 1, remove confirmation at 0)
    Remove: text link "Remove"
    Move to Wishlist: text link

  [COUPON CODE]
    Input + "Apply" button
    Validated coupons show green badge with savings

Right (35%):
  [ORDER SUMMARY CARD]
    Subtotal, Discount, Shipping, Tax, TOTAL
    Savings highlight (green)
    "Proceed to Checkout" — full-width primary button
    "Continue Shopping" — text link
    Trust signals: lock icon + "Secure checkout"
    Payment icons row

[EMPTY CART STATE]
    Large elegant illustration
    "Your cart is empty"
    CTA: "Browse New Arrivals"
    Below: "You may also like" (4 trending products)
```

---

### PAGE 5: CHECKOUT PAGE

**Multi-step with progress indicator (no page reload — React state)**

```
[PROGRESS BAR]   ① Delivery  ② Payment  ③ Review & Pay

STEP 1 — DELIVERY
  Guest option: Email input + "Continue as Guest"
  Login option: "Already have an account? Login"
  Address form: Full name, Phone, Address lines, City, State, Pincode
  Saved addresses: Clickable address cards (for logged-in users)
  Delivery options: Standard Free / Express ₹99 / Same-day ₹199

STEP 2 — PAYMENT
  UPI:        UPI ID input or QR code
  Cards:      Secure card input (Razorpay hosted fields)
  Net Banking: Bank dropdown
  EMI:        Installment options grid
  COD:        If eligible (₹50 fee shown)
  Wallets:    Paytm, PhonePe, Amazon Pay

STEP 3 — REVIEW
  Order summary with images
  Delivery + payment method shown
  Edit links for each section
  "Place Order" — large CTA
  Legal text below

[ORDER CONFIRMATION PAGE]
  Large animated checkmark (Lottie)
  Order number: VL-20260001
  "A confirmation has been sent to [email]"
  Estimated delivery date
  CTA: "Track Your Order" | "Continue Shopping"
  Cross-sell: "Complete the look" — matching blouses/accessories
```

---

### PAGE 6: USER DASHBOARD

```
[DASHBOARD SIDEBAR / TAB NAV]
  My Orders | Wishlist | Addresses | Profile | Notifications | Logout

[MY ORDERS]
  Tab filters: All | Processing | Shipped | Delivered | Cancelled
  Order card: Order# + date + status pill + item thumbnails + total + Actions
  Actions: View Details | Track | Return/Cancel
  Order Detail: Full item list + timeline tracker (4-step: Confirmed→Packed→Shipped→Delivered)

[WISHLIST]
  2-3 column grid of saved sarees
  Each: Product card + "Move to Cart" + "Remove"
  Empty: "Your wishlist is empty" + Browse CTA

[ADDRESSES]
  Address cards with Edit/Delete
  "Add New Address" card with + icon
  Default address highlighted with gold border

[PROFILE]
  Avatar upload
  Name, Email, Phone (with OTP verification)
  Password change
  Notification preferences
  Account deletion option (with confirmation)

[NOTIFICATIONS]
  In-app notification feed
  Order updates, price drops on wishlisted items, new arrivals in saved categories
```

---

## 7. MOBILE APP SCREEN SPECIFICATIONS (Flutter)

### Navigation Structure
```
Bottom Nav Bar (4 tabs):
  🏠 Home    🛍 Shop    ❤ Wishlist    👤 Account

Top: Search bar (persistent on Home/Shop)
Floating: Cart FAB (shows count badge)
```

### Mobile-Specific UX Enhancements
```
1. SWIPE GESTURES
   - Swipe left on cart item to reveal Remove
   - Swipe down on product detail to dismiss
   - Swipe through product images (native feel)

2. HAPTIC FEEDBACK
   - Light tap: adding to wishlist
   - Medium: add to cart
   - Heavy: order placed

3. PRODUCT GALLERY
   - Hero image with pinch-to-zoom
   - Full-screen gallery mode
   - Color swatch tap → instant image swap with crossfade

4. CHECKOUT (optimized mobile flow)
   - Saved UPI IDs auto-suggested
   - Address autofill via Google Places API
   - Biometric authentication for returning users
   - One-tap reorder from order history

5. SEARCH
   - Recent searches chip row
   - Visual category shortcuts
   - Voice search button
   - Trending search pills

6. PUSH NOTIFICATIONS
   - Order status updates (with deep link to order)
   - Price drop alerts for wishlisted items
   - New collection launches
   - Abandoned cart reminder (after 2 hours)

7. OFFLINE SUPPORT
   - Cached last-viewed products (Hive)
   - Wishlist available offline
   - Cart persisted locally
```

### Flutter Theme (app_theme.dart — centralized)
```dart
class AppColors {
  static const Color primary        = Color(0xFF8B1A2E);
  static const Color primaryDark    = Color(0xFF5E1020);
  static const Color primaryLight   = Color(0xFFFDF0F2);
  static const Color gold           = Color(0xFFC4922A);
  static const Color goldLight      = Color(0xFFE8C97A);
  static const Color ivory          = Color(0xFFFBF8F3);
  static const Color cream          = Color(0xFFF2EBE0);
  static const Color textPrimary    = Color(0xFF1C1410);
  static const Color textSecondary  = Color(0xFF4A3F38);
  static const Color textMuted      = Color(0xFF8A7B72);
  static const Color success        = Color(0xFF2E6B47);
  static const Color error          = Color(0xFFC42B2B);
  static const Color border         = Color(0xFFE8DDD0);
}

ThemeData appTheme = ThemeData(
  useMaterial3: true,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.primary,
    primary: AppColors.primary,
    secondary: AppColors.gold,
    surface: AppColors.ivory,
    onSurface: AppColors.textPrimary,
  ),
  textTheme: GoogleFonts.interTextTheme().copyWith(
    displayLarge: GoogleFonts.cormorantGaramond(fontSize: 52, fontWeight: FontWeight.w300),
    displayMedium: GoogleFonts.cormorantGaramond(fontSize: 40, fontWeight: FontWeight.w400),
    headlineLarge: GoogleFonts.cormorantGaramond(fontSize: 32, fontWeight: FontWeight.w500),
    headlineMedium: GoogleFonts.cormorantGaramond(fontSize: 26, fontWeight: FontWeight.w500),
    titleLarge: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600),
    titleMedium: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600),
    bodyLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w400),
    bodyMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400),
    labelLarge: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w600, letterSpacing: 0.5),
    labelSmall: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.5),
  ),
);
```

---

## 8. SAREE PRODUCT MODEL — DETAILED BUSINESS RULES

### Variant & Pricing Logic
```
Each Saree (Product) can have:
  → Multiple Color Variants  (e.g., Royal Blue, Peacock Green, Ivory)

Each Color Variant has:
  → Its own images
  → Its own price (cost_price + sale_price + original_price/MRP)
  → Optional unique Saree Code (e.g., VL-KNJ-001-RB)
       - Can be shared across colors (one code for the style)
       - Or unique per color (one code per color + style)
  → Optional Barcode (EAN-13 or custom)
       - Used for physical inventory scanning
       - Shown in admin/staff view
       - Hidden from customer-facing UI (unless store enables it)
  → Stock qty tracked per variant
  → "Reserved qty" = items in active carts (decrements available stock)

Pricing Display Rules:
  → If sale_price < original_price: show both + savings badge
  → If all prices are same across colors: show single price
  → If prices differ by color: show "From ₹X,XXX" on listing card
  → Show: "Price: ₹18,500" only after color is selected on PDP

Admin Inventory Flow:
  → Barcode scan (staff app) → finds variant by barcode → shows details
  → Can update stock, mark as sold, generate barcode label PDF
  → Low stock alert: email + dashboard notification when qty ≤ 5
```

---

## 9. ADMIN PANEL FEATURES

```
DASHBOARD
  → Today's revenue, orders count, new customers
  → Revenue chart (daily/weekly/monthly toggle)
  → Recent orders table
  → Low stock alerts
  → Top selling sarees

PRODUCT MANAGEMENT
  → Add/Edit/Delete products
  → Variant management: add color variants, upload images per color
  → Bulk price update
  → Drag-drop image sorting
  → Barcode generator (download PNG / print label)
  → Saree code generator (auto-suggest format)
  → CSV import/export
  → Product preview (before publish)

ORDER MANAGEMENT
  → Order list with filters (status, date, amount)
  → Order detail: items, customer, address, payment info
  → Status update with email notification trigger
  → Bulk status update
  → Print invoice (PDF)
  → Add tracking number

CUSTOMER MANAGEMENT
  → Customer list + search
  → Customer detail: order history, addresses, review history
  → Block/unblock customer

REPORTS
  → Sales by product / category / period
  → Revenue reports
  → Inventory report (low stock, out of stock)
  → Customer acquisition report
```

---

## 10. DEVELOPMENT PHASES & TIMELINE

### Phase 1 — Foundation (Weeks 1-3)
```
✓ Project setup: Next.js + Prisma + PostgreSQL
✓ Design system: Tailwind config + CSS tokens + base components
✓ Auth: NextAuth (email/password + Google + phone OTP)
✓ Database: Schema setup + migrations
✓ Image upload: Cloudinary integration
✓ Admin: Product CRUD with variant management
✓ Flutter: Project setup + theme + routing
```

### Phase 2 — Core Shopping (Weeks 4-6)
```
✓ Home page (all sections)
✓ Category & listing page with filters
✓ Product detail page (full variant + swatch experience)
✓ Cart (guest + logged-in, persisted)
✓ Wishlist
✓ Search (PostgreSQL full-text)
✓ Flutter: Home, Shop, Product Detail, Cart screens
```

### Phase 3 — Checkout & Orders (Weeks 7-9)
```
✓ Checkout flow (address + payment)
✓ Razorpay integration (web + Flutter)
✓ Order confirmation + emails (Resend + React Email)
✓ User dashboard (orders, addresses, profile)
✓ Order tracking page
✓ Flutter: Checkout + Order screens
```

### Phase 4 — Admin & Operations (Weeks 10-12)
```
✓ Full admin panel
✓ Barcode generation + printing
✓ Coupon / discount engine
✓ Review system (moderation)
✓ Push notifications (FCM) in Flutter
✓ Low-stock alerts
✓ Staff barcode scanner screen (Flutter)
```

### Phase 5 — Polish & Launch (Weeks 13-14)
```
✓ SEO optimization (meta, sitemap, structured data)
✓ Performance: Core Web Vitals, image optimization
✓ Accessibility audit (WCAG 2.1 AA)
✓ Cross-browser / device testing
✓ Load testing
✓ Flutter App Store / Play Store submission
✓ Soft launch + monitoring setup
```

---

## 11. KEY TECHNICAL DECISIONS

```
1. NEXT.JS APP ROUTER + RSC
   Product pages are Server Components (fast, SEO-friendly)
   Cart/Auth interactions are Client Components
   Streaming with Suspense for below-the-fold sections

2. OPTIMISTIC UI
   Add to cart / wishlist update instantly (Zustand) then sync to server
   Prevents perceived lag on mobile

3. IMAGE STRATEGY
   Cloudinary: auto-format (WebP/AVIF), responsive srcsets, quality auto
   BlurHash stored in DB for instant placeholder on load
   Lazy loading for all below-fold images

4. COLOR SWATCH PERFORMANCE
   Swatch colors stored as hex in DB (no image needed for swatch dots)
   Images per variant lazy-fetched only when variant selected

5. TAILWIND + CSS CUSTOM PROPERTIES
   Design tokens defined as CSS custom properties
   Tailwind extends those tokens → single source of truth
   Flutter reads from AppColors (same values, different syntax)

6. DATABASE INDEXES
   products: (category_id, is_active, created_at)
   product_variants: (product_id, is_active)
   orders: (user_id, status, created_at)
   Full-text index on products(name, description) for search
```

---

## 12. COMPONENT LIBRARY PRIORITY ORDER

Build in this order (each used by multiple pages):

```
1. Button (primary, secondary, ghost, icon)
2. Input + Select + Checkbox + Radio
3. Badge / Chip
4. ProductCard
5. ColorSwatch + SwatchGrid
6. PriceDisplay
7. Header + MobileNav
8. ProductGrid + Skeleton
9. ImageGallery
10. Modal + Drawer + BottomSheet
11. Toast / Snackbar
12. Cart Drawer
13. FilterSidebar / FilterBottomSheet
14. OrderCard / OrderTimeline
15. AddressCard + AddressForm
```

---

*End of Plan — Ready to scaffold project structure and begin Phase 1*

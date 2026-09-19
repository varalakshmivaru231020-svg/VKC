# About film — photographs

The About page (`/about`) is built from named photograph slots. **You replace a
photograph in Admin → Banners, not in code**: create a banner, choose the
position from the table below, upload the image (add a "mobile image" if the
phone crop should differ), and mark it active. The placeholder disappears, and
so does its caption and its credit line.

The hero also accepts a video: upload an `.mp4` or `.webm` as the banner image
and give it a still as the mobile image. The video plays on larger screens only;
phones, and anyone with reduced motion switched on, get the still. Keep it
silent, 10–20 seconds, under about 6 MB.

Slots are defined in `lib/about-media.ts`.

## What is real and what is a placeholder

| Scene | Banner position | Now showing | Status |
| --- | --- | --- | --- |
| 00 Hero | `about_hero` | `cane-field-srirangapatna.webp` | **Placeholder** |
| 01 The Story (tall inset) | `about_story` | `cane-stalks.webp` | **Placeholder** |
| 02 1988 | `about_1988` | `ikshu-cane-sky.webp` | **Placeholder** |
| 04 The Founder | — (fixed) | `founder-portrait.webp` | Real — from `founder image.jpg` |
| 05 Mandya | `about_mandya` | `fields-dusk-srirangapatna.webp` | **Placeholder** |
| 06 The Farmer | `about_farmer` | `harvest-doddagowdana-koppalu.webp` | **Placeholder** |
| 09 · 01 The Field | `about_field` | `kaveri-mandya.webp` | **Placeholder** |
| 09 · 02 The Harvest | `about_harvest` | `cane-stalks.webp` | **Placeholder** |
| 09 · 03 The Craft | `about_craft` | `jaggery-pan.webp` | **Placeholder** |
| 09 · 04 The Sweetness | `about_sweetness` | The home hero slide | Real VKC product photograph |
| 10 VKC Today (range) | — | Live product images from the catalogue | Real |
| 12 The Future (faint backdrop) | `about_future` | `cane-field-srirangapatna.webp` | **Placeholder** |

`lib/about-media.ts` carries a `brief` for every slot describing the photograph
that should go there. The one that matters most is **06 The Farmer**: a farmer
VKC actually buys from, photographed with their consent.

## About the placeholders

None of them is a VKC photograph and none shows an identifiable person. They
are documentary frames from Wikimedia Commons, most taken in Mandya district
itself, cropped and lightly colour-graded. While any of them is on the page, the
closing scene prints a credit line automatically — the licences require it.

| File | Author | Licence | Source |
| --- | --- | --- | --- |
| `cane-field-srirangapatna.webp` | Timothy A. Gonsalves | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Sugarcane_Field_Srirangapatna_Karnataka_Jul22_R16_06192.jpg |
| `harvest-doddagowdana-koppalu.webp` | Timothy A. Gonsalves | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Harvesting_Sugarcane_Doddagowdana_Koppalu_Aug24_A7CR_02231.jpg |
| `kaveri-mandya.webp` | Timothy A. Gonsalves | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Kaveri_Spate_Mandya_Karnataka_Jul24_A7CR_01964.jpg |
| `fields-dusk-srirangapatna.webp` | Deepak TL | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Paddy_fields_near_Srirangapattana.jpg |
| `ikshu-cane-sky.webp` | Dinesh Valke | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Ikshu_(Sanskrit-_%E0%A4%87%E0%A4%95%E0%A5%8D%E0%A4%B7%E0%A5%81)_(4396779315).jpg |
| `jaggery-pan.webp` | Accesscrawl | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Traditional_Jaggery_making_in_India.jpg |
| `cane-stalks.webp` | Captain Raju | CC0 | https://commons.wikimedia.org/wiki/File:Sugarcane_in_2021.01.jpg |

### Before this page goes live

Timothy A. Gonsalves' licence allows commercial use with credit, but his Commons
page asks to be **contacted before commercial use** (tagooty@yahoo.com). Three
placeholders are his — the hero, the farmer scene and the field. Either write
to him first, or replace those three slots with VKC's own photographs before
publishing. `fields-dusk-srirangapatna.webp` shows paddy, not cane, and is
captioned as fields for that reason.

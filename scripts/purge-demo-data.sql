-- One-off purge of the old saree demo catalogue so the store can start fresh
-- with jaggery products. Deletes: all categories, all products (+variants,
-- images, attributes, cart/wishlist lines, reviews), all orders (+items,
-- returns), video gallery items, and every user EXCEPT the admin.
--
-- Keeps: site_settings, gallery IMAGE items, blogs/events/pages/banners/etc,
-- coupons, shipping zones, role templates, and the ADMIN account.
--
-- A full backup was taken first (scratchpad/vijaylakshmi-fullbackup-*.dump).
-- Order follows the FK graph; RESTRICT children are removed before parents.

BEGIN;

-- Reviews reference products (RESTRICT) and users (RESTRICT) — clear first.
DELETE FROM reviews;

-- Order return chain, then order items, then orders.
DELETE FROM order_return_items;
DELETE FROM order_returns;
DELETE FROM order_items;
DELETE FROM orders;

-- Cart/wishlist lines block variant deletion (RESTRICT) — clear before products.
DELETE FROM cart_items;
DELETE FROM wishlist_items;

-- Products — cascades product_variants, product_images, product_attributes.
DELETE FROM products;

-- Categories — product/story/self references are all ON DELETE SET NULL.
DELETE FROM categories;

-- Videos only (type='VIDEO'); the 5 gallery IMAGE items are kept.
DELETE FROM gallery_items WHERE type = 'VIDEO';

-- Every non-admin user, plus the dependents that block their deletion
-- (wallets + wallet_transactions and addresses are ON DELETE RESTRICT).
DELETE FROM wallet_transactions
  WHERE "walletId" IN (SELECT id FROM wallets WHERE "userId" IN (SELECT id FROM users WHERE role <> 'ADMIN'));
DELETE FROM wallets
  WHERE "userId" IN (SELECT id FROM users WHERE role <> 'ADMIN');
DELETE FROM addresses
  WHERE "userId" IN (SELECT id FROM users WHERE role <> 'ADMIN');
DELETE FROM users WHERE role <> 'ADMIN';

COMMIT;

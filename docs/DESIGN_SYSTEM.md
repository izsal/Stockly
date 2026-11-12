# Stockly — UI/UX Design System

- Product: Stockly
- Audience: Indonesian SME owners and store staff
- Platform: Responsive web application
- Default language: Bahasa Indonesia
- Visual direction: Modern, clean, practical SaaS dashboard

## 1. Design goals

1. Make stock status understandable at a glance.
2. Make stock-in and stock-out actions quick and hard to misuse.
3. Keep tables readable for users with many products.
4. Work well on laptop, tablet, and mobile browsers.
5. Use clear Indonesian labels and helpful empty/error states.
6. Prioritize clarity over decorative visuals.

## 2. Visual direction

- Light theme first.
- Neutral gray surfaces with one restrained primary accent.
- Use semantic colors only for status: success, warning, danger, info.
- Avoid excessive gradients, glassmorphism, and oversized cards.
- Use consistent spacing, borders, and typography.
- Use Lucide icons with text labels for important actions.

Suggested palette (tokens may be adjusted after implementation):
- Background: neutral near-white
- Surface: white
- Text: slate/neutral 900
- Muted text: slate/neutral 500
- Border: slate/neutral 200
- Primary: indigo/blue 600
- Success: emerald 600
- Warning: amber 600
- Danger: red 600
- Info: sky 600

Use semantic CSS variables compatible with shadcn/ui rather than hardcoding colors in every component.

## 3. Typography and layout

- Use a readable sans-serif font (e.g. Geist or system sans).
- Page title: 24–30px desktop, scaled down on mobile.
- Section title: 16–20px.
- Body: 14–16px.
- Table text: 13–14px.
- Use a consistent content max-width and comfortable page padding.
- Sidebar on desktop; drawer/sheet navigation on mobile.
- Keep primary page action near the page title.

## 4. Application shell

### Desktop
- Left sidebar: 240–260px expanded, collapsible if desired.
- Header: workspace name/switcher, help placeholder, user menu.
- Main content: page title, description, primary action, content.
- Sidebar groups:
  - Ringkasan: Dashboard
  - Inventaris: Produk, Kategori, Stok Masuk, Stok Keluar, Riwayat Stok
  - Relasi: Supplier
  - Laporan: Laporan Stok
  - Pengaturan: Workspace, Akun

### Mobile
- Use a top bar with menu button and workspace context.
- Sidebar becomes a Sheet/Drawer.
- Forms use full-width controls.
- Data tables may use horizontal scrolling or responsive row cards.
- Primary actions must remain easy to reach.

## 5. Core pages

### 5.1 Dashboard
Show:
- Total produk aktif
- Total unit stok (sum of quantities; label clearly)
- Produk stok menipis
- Produk habis
- Recent stock movements
- Stock movement summary for selected period

Avoid presenting “inventory value” unless the calculation basis (cost price × current quantity) is clearly labeled.

### 5.2 Product list
- Search by name, SKU, or barcode.
- Filters: category and status.
- Paginated table.
- Columns: Produk, SKU, Kategori, Stok, Minimum, Harga jual, Status, Actions.
- Low-stock and out-of-stock statuses must be visually distinct.
- Primary action: “Tambah Produk”.
- Bulk actions are deferred.

### 5.3 Product create/edit
Fields:
- Nama produk (required)
- SKU (required)
- Barcode (optional)
- Kategori (optional)
- Satuan (required; default pcs)
- Harga modal (default 0)
- Harga jual (default 0)
- Stok minimum (default 0)
- Deskripsi (optional)

Do not let users directly edit current stock in the product form. Initial stock must be added through an opening-balance stock movement.

### 5.4 Supplier list and form
- Supplier name
- Phone
- Email
- Address
- Notes
- Search and pagination

### 5.5 Stock In
- Product selector with SKU and current stock
- Quantity
- Supplier (optional)
- Reference number (optional)
- Date/time
- Notes
- Confirmation summary before submit

### 5.6 Stock Out
- Product selector with available stock
- Quantity
- Reason (e.g. sale, damaged, internal use, other)
- Reference number (optional)
- Notes
- Show insufficient-stock validation before submit and enforce again on server

### 5.7 Stock Adjustment
- Product selector
- Current system stock (read-only)
- Physical counted quantity
- Calculated difference
- Reason/notes
- Confirmation before submit

### 5.8 Movement history
- Date range
- Product filter
- Movement type filter
- Search by product/SKU/reference
- Columns: date, product, type, quantity change, before, after, actor
- Movement rows are read-only.

### 5.9 Reports
- Current stock report
- Low-stock report
- Movement report by date range
- CSV export
- Clearly show the selected date range and timezone.

## 6. Reusable components

- `AppSidebar`
- `AppHeader`
- `PageHeader`
- `WorkspaceSwitcher`
- `StatCard`
- `DataTable`
- `DataTableToolbar`
- `ProductStatusBadge`
- `EmptyState`
- `ConfirmDialog`
- `FormField`
- `ProductCombobox`
- `DateRangeFilter`
- `MovementTypeBadge`
- `StockQuantityDisplay`
- `LoadingSkeleton`
- `ErrorState`

Use shadcn/ui primitives where suitable: Button, Input, Select, Dialog, Sheet, DropdownMenu, Table, Badge, Card, Skeleton, Form, AlertDialog, Popover, Calendar, Tooltip, Tabs.

## 7. Interaction rules

- Destructive actions require confirmation.
- Product deletion is blocked or replaced with archive when movement history exists.
- Stock mutations show a confirmation summary.
- Disable submit while a mutation is pending.
- Prevent accidental double submission.
- Show toast feedback after successful actions.
- Keep form values when server validation fails.
- Use clear inline validation messages in Bahasa Indonesia.
- Empty states should explain what to do next and include a relevant CTA.
- Never rely on color alone to communicate stock status; include text labels.

## 8. Accessibility

- All controls have labels.
- Keyboard navigation works for dialogs, menus, and forms.
- Focus is visible.
- Dialogs trap focus and return focus when closed.
- Color contrast meets WCAG AA where practical.
- Icons-only buttons have accessible labels.
- Tables have semantic headers.

## 9. Responsive breakpoints

Use Tailwind defaults unless the implementation requires otherwise:
- Mobile: < 640px
- Tablet: 640–1023px
- Desktop: >= 1024px

Test at 375px, 768px, 1024px, and 1440px widths.

## 10. MVP visual acceptance criteria

- Consistent spacing and typography across pages.
- Sidebar navigation works on desktop and mobile.
- Product table is usable on small screens.
- Forms show required/optional fields clearly.
- Low-stock and out-of-stock states are distinguishable.
- Loading, empty, success, and error states exist.
- No placeholder buttons without working behavior.

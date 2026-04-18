# 🏷️ ThreadGold — Thrift Fashion E-Commerce

A complete, ready-to-use thrift clothing website with:
- Full shopping experience (browse, product detail, cart, checkout)
- Indian address form with all 28 states + UTs
- COD, UPI, Card, Net Banking payment options
- Order management with 24-hour cancellation
- Secure admin dashboard (password protected)

---

## 📁 FILE STRUCTURE (Where Everything Lives)

```
thriftstore/
│
├── index.html              ← HOME PAGE (open this first!)
│
├── css/
│   └── style.css           ← All the styling/design
│
├── js/
│   └── app.js              ← All the logic (cart, orders, etc.)
│
├── pages/
│   ├── shop.html           ← Browse all products with filters
│   ├── product.html        ← Single product detail view
│   ├── checkout.html       ← Address + Payment + Order
│   └── orders.html         ← My Orders (with cancel option)
│
└── admin/
    └── dashboard.html      ← Admin Panel (password protected)
```

---

## 🚀 HOW TO OPEN IN VS CODE (Step by Step for Beginners)

### Step 1: Install VS Code
- Go to https://code.visualstudio.com
- Download and install it (free)

### Step 2: Install the "Live Server" Extension
- Open VS Code
- Click the square icon on the left sidebar (Extensions)
- Search for: **Live Server**
- Click **Install** on the one by Ritwick Dey

### Step 3: Open Your Project
- In VS Code, click **File** → **Open Folder**
- Find and select the `thriftstore` folder
- You'll see all the files in the left panel

### Step 4: Launch the Website
- Right-click on `index.html` in the left panel
- Click **"Open with Live Server"**
- Your browser will open with the website! 🎉

---

## 👤 HOW TO LOG IN

### Regular User
- Click "Sign In" on the top right
- Use **any email** + **any password** (6+ characters)
- Example: `test@gmail.com` / `password123`

### Admin Login
- Go to: `admin/dashboard.html` in the browser
- OR sign in with these credentials from any page:
  - **Email:** admin@threadgold.in
  - **Password:** admin123
- The Admin panel shows up in the nav bar after admin login

---

## 🛒 HOW THE STORE WORKS

1. **Browse** → Visit Shop page, use filters/search
2. **Add to Cart** → Click any product, add to cart
3. **Checkout** → Fill Indian address, choose payment
4. **Orders** → View all orders, cancel within 24 hours

---

## ⚙️ ADMIN PANEL FEATURES

| Feature | What You Can Do |
|---------|----------------|
| Overview | See revenue, orders, products, customers at a glance |
| Orders | View all orders, change status (Confirmed → Shipped → Delivered) |
| Products | View, search, add new products, delete products |
| Customers | View customer list with order history |

---

## 📌 IMPORTANT NOTES

- All data is saved in your **browser's local storage** — so it persists between page refreshes
- This is a **frontend-only** demo — no real payments or backend server
- To share with others, you'd need to host it (e.g., on GitHub Pages, Netlify, or Vercel — all free)

---

## 🎨 DESIGN

- Dark premium aesthetic with gold accents
- Playfair Display (headings) + DM Sans (body) fonts
- Fully responsive (works on mobile too)
- Animated cart sidebar, toast notifications, smooth transitions

---

## ❓ NEED HELP?

- If nothing shows up: make sure you're using Live Server (not just opening the file directly)
- If styles look broken: make sure the folder structure is exactly as above
- Admin panel not accessible: sign in with admin@threadgold.in / admin123 first

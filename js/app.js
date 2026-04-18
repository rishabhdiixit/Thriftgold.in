const PRODUCTS = [
 ,
//   { id: 2, name: 'Silk Floral Midi Dress', brand: 'Zara', category: 'Dresses', size: 'S', condition: 'Good', price: 899, originalPrice: 3200, emoji: '👗', badge: null, quantity: 3 },
//   { id: 3, name: 'Oversized Wool Blazer', brand: 'H&M', category: 'Blazers', size: 'L', condition: 'Excellent', price: 1599, originalPrice: 5500, emoji: '🥼', badge: 'New', quantity: 4 },
//   { id: 4, name: 'Classic Denim Jeans', brand: 'Wrangler', category: 'Bottoms', size: '32', condition: 'Good', price: 699, originalPrice: 2200, emoji: '👖', badge: null, quantity: 2 },
//   { id: 5, name: 'Cashmere Sweater', brand: 'Marks & Spencer', category: 'Tops', size: 'M', condition: 'Like New', price: 1899, originalPrice: 7000, emoji: '🧶', badge: 'Premium', quantity: 1 },
//   { id: 6, name: 'Leather Crossbody Bag', brand: 'Coach', category: 'Accessories', size: 'OS', condition: 'Excellent', price: 2499, originalPrice: 9000, emoji: '👜', badge: 'Popular', quantity: 3 },
//   { id: 7, name: 'Printed Kurta Set', brand: 'FabIndia', category: 'Ethnic', size: 'L', condition: 'Good', price: 799, originalPrice: 2800, emoji: '🥻', badge: null, quantity: 6 },
//   { id: 8, name: 'Summer Linen Shirt', brand: 'Uniqlo', category: 'Tops', size: 'XL', condition: 'Excellent', price: 599, originalPrice: 1800, emoji: '👔', badge: 'New', quantity: 4 },
//   { id: 9, name: 'Formal Trousers', brand: 'Van Heusen', category: 'Bottoms', size: '34', condition: 'Like New', price: 899, originalPrice: 3000, emoji: '👖', badge: null, quantity: 2 },
//   { id: 10, name: 'Bomber Jacket', brand: 'Roadster', category: 'Jackets', size: 'M', condition: 'Good', price: 1199, originalPrice: 3800, emoji: '🧥', badge: null, quantity: 5 },
//   { id: 11, name: 'Anarkali Suit', brand: 'W', category: 'Ethnic', size: 'M', condition: 'Excellent', price: 1099, originalPrice: 4200, emoji: '👘', badge: 'Popular', quantity: 3 },
//   { id: 12, name: 'Denim Skirt', brand: 'Only', category: 'Bottoms', size: 'S', condition: 'Good', price: 549, originalPrice: 1600, emoji: '🩱', badge: null, quantity: 0 },
 ];

const CATEGORIES = [
  { name: 'Jackets', icon: '🧥', count: 48 },
  { name: 'Dresses', icon: '👗', count: 63 },
  { name: 'Tops', icon: '👕', count: 120 },
  { name: 'Bottoms', icon: '👖', count: 95 },
  { name: 'Ethnic', icon: '🥻', count: 72 },
  { name: 'Accessories', icon: '👜', count: 34 },
  { name: 'Blazers', icon: '🥼', count: 29 },
  { name: 'Shoes', icon: '👟', count: 55 },
];

const PRODUCT_STORAGE_KEY = 'tg_products';
const ADMIN_CREDENTIALS = { email: 'admin@threadgold.in', password: 'admin123' };
const REMOTE_PRODUCTS_COLLECTION = 'products';
const REMOTE_ORDERS_COLLECTION = 'orders';

function loadProducts() {
  try {
    const savedProducts = JSON.parse(localStorage.getItem(PRODUCT_STORAGE_KEY) || 'null');
    if (!Array.isArray(savedProducts) || savedProducts.length === 0) return;
    PRODUCTS.splice(0, PRODUCTS.length, ...savedProducts);
  } catch (error) {
    console.error('Failed to load saved products:', error);
  }
}

function saveProducts() {
  localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(PRODUCTS));
}

function sortProductsNewestFirst(list) {
  return list.slice().sort((a, b) => {
    const aKey = (a?.createdAt ?? a?.id ?? 0);
    const bKey = (b?.createdAt ?? b?.id ?? 0);
    return bKey - aKey;
  });
}

async function loadProductsFromRemote() {
  if (!window.tgFirestore) return false;
  const snapshot = await window.tgFirestore.collection(REMOTE_PRODUCTS_COLLECTION).get();
  const remote = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data) remote.push(data);
  });

  if (!Array.isArray(remote) || remote.length === 0) return false;
  const sorted = sortProductsNewestFirst(remote);
  PRODUCTS.splice(0, PRODUCTS.length, ...sorted);
  saveProducts(); // cache locally for faster loads/offline
  return true;
}

async function upsertRemoteProduct(product) {
  if (!window.tgFirestore) return;
  const id = String(product.id);
  await window.tgFirestore.collection(REMOTE_PRODUCTS_COLLECTION).doc(id).set(product, { merge: true });
}

async function deleteRemoteProduct(productId) {
  if (!window.tgFirestore) return;
  const id = String(productId);
  await window.tgFirestore.collection(REMOTE_PRODUCTS_COLLECTION).doc(id).delete();
}

// Promise that pages can await before reading PRODUCTS.
window.productsReady = (async () => {
  try {
    const ok = await loadProductsFromRemote();
    if (ok) return true;
  } catch (e) {
    console.warn('Remote products load failed; falling back to localStorage.', e);
  }
  loadProducts();
  return false;
})();

async function loadOrdersFromRemote() {
  if (!window.tgFirestore) return false;
  const snapshot = await window.tgFirestore.collection(REMOTE_ORDERS_COLLECTION).get();
  const remote = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data) remote.push(data);
  });
  if (!Array.isArray(remote) || remote.length === 0) return false;
  const sorted = remote.slice().sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
  state.orders = sorted;
  saveState(); // cache locally
  return true;
}

async function upsertRemoteOrder(order) {
  if (!window.tgFirestore) return;
  const id = String(order.id);
  await window.tgFirestore.collection(REMOTE_ORDERS_COLLECTION).doc(id).set(order, { merge: true });
}

let ordersUnsubscribe = null;
let ordersListenerStarted = false;

function applyOrdersSnapshot(docs) {
  const remote = docs.map((d) => d.data()).filter(Boolean);
  const sorted = remote.slice().sort((a, b) => (b?.timestamp ?? 0) - (a?.timestamp ?? 0));
  state.orders = sorted;
  saveState();
}

function ensureOrdersListener() {
  if (!window.tgFirestore) return null;
  if (ordersListenerStarted) return ordersUnsubscribe;
  ordersListenerStarted = true;

  try {
    ordersUnsubscribe = window.tgFirestore
      .collection(REMOTE_ORDERS_COLLECTION)
      .onSnapshot((snapshot) => {
        applyOrdersSnapshot(snapshot.docs);
      }, (err) => {
        console.warn('Orders listener failed', err);
      });
  } catch (e) {
    console.warn('Failed to start orders listener', e);
  }
  return ordersUnsubscribe;
}

// Promise that pages can await before reading state.orders.
// Uses realtime listener when available, so status changes sync across devices.
window.ordersReady = (async () => {
  if (window.tgFirestore) {
    return await new Promise((resolve) => {
      try {
        const unsub = window.tgFirestore.collection(REMOTE_ORDERS_COLLECTION).onSnapshot((snapshot) => {
          applyOrdersSnapshot(snapshot.docs);
          try { unsub(); } catch (_) {}
          ensureOrdersListener();
          resolve(true);
        }, (err) => {
          console.warn('Remote orders initial snapshot failed; falling back to localStorage.', err);
          resolve(false);
        });
      } catch (e) {
        console.warn('Remote orders snapshot setup failed; falling back to localStorage.', e);
        resolve(false);
      }
    });
  }

  try {
    const ok = await loadOrdersFromRemote();
    if (ok) return true;
  } catch (e) {
    console.warn('Remote orders load failed; falling back to localStorage.', e);
  }
  return false;
})();

function getProductPrimaryImage(product) {
  return Array.isArray(product?.images) && product.images.length > 0 ? product.images[0] : null;
}

function renderProductCardMedia(product) {
  const src = getProductPrimaryImage(product);
  if (src) {
    return `<img class="product-img-media" src="${src}" alt="${product?.name || 'Product'}">`;
  }
  return `<div style="font-size:64px; line-height:1;">${product?.emoji || '👗'}</div>`;
}

function getBasePrefix() {
  const path = window.location.pathname.replace(/\\/g, '/');
  return path.includes('/pages/') || path.includes('/admin/') ? '../' : '';
}

let state = {
  cart: JSON.parse(localStorage.getItem('tg_cart') || '[]'),
  wishlist: JSON.parse(localStorage.getItem('tg_wishlist') || '[]'),
  orders: JSON.parse(localStorage.getItem('tg_orders') || '[]'),
  user: JSON.parse(localStorage.getItem('tg_user') || 'null'),
  currentFilter: 'All',
};

loadProducts();

function saveState() {
  localStorage.setItem('tg_cart', JSON.stringify(state.cart));
  localStorage.setItem('tg_wishlist', JSON.stringify(state.wishlist));
  localStorage.setItem('tg_orders', JSON.stringify(state.orders));
  if (state.user) {
    localStorage.setItem('tg_user', JSON.stringify(state.user));
  } else {
    localStorage.removeItem('tg_user');
  }
}

function showToast(msg, type = 'default') {
  const icons = { default: '✨', success: '✅', error: '❌' };
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return;

  // Check if product is sold out
  const quantity = product.quantity !== undefined ? product.quantity : 1;
  if (quantity === 0) {
    showToast('This item is sold out!', 'error');
    return;
  }

  const exists = state.cart.find((item) => item.id === productId);
  if (exists) {
    showToast('Already in your cart!');
    return;
  }

  state.cart.push({ ...product });
  saveState();
  updateCartUI();
  showToast(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
  state.cart = state.cart.filter((item) => item.id !== productId);
  saveState();
  updateCartUI();
  renderCartItems();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price, 0);
}

function updateCartUI() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  badge.textContent = state.cart.length;
  badge.style.display = state.cart.length > 0 ? 'flex' : 'none';
}

function renderCartItems() {
  const container = document.getElementById('cartItemsList');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛍️</div><h3>Your cart is empty</h3><p>Browse our collection to find something you love</p></div>';
    const total = document.getElementById('cartTotal');
    if (total) total.textContent = '₹0';
    return;
  }

  container.innerHTML = state.cart.map((item) => `
    <div class="cart-item">
      <div class="cart-item-img" style="display:flex; align-items:center; justify-content:center; overflow:hidden; border:1px solid var(--border); border-radius:14px; background:rgba(255,255,255,0.02);">
        ${
          getProductPrimaryImage(item)
            ? `<img src="${getProductPrimaryImage(item)}" alt="${item.name}" style="width:100%; height:100%; object-fit:cover;">`
            : `${item.emoji || '👗'}`
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-brand">${item.brand}</div>
        <div class="cart-item-name">${item.name}</div>
        <div style="font-size:11px; color:var(--muted); margin-top:4px;">Size: ${item.size} · ${item.condition}</div>
        <div class="cart-item-price">₹${item.price.toLocaleString('en-IN')}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">×</button>
    </div>
  `).join('');

  const total = document.getElementById('cartTotal');
  if (total) total.textContent = `₹${getCartTotal().toLocaleString('en-IN')}`;
}

function openCart() {
  document.getElementById('cartOverlay')?.classList.add('open');
  document.getElementById('cartPanel')?.classList.add('open');
  renderCartItems();
}

function closeCart() {
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.getElementById('cartPanel')?.classList.remove('open');
}

function toggleWishlist(productId) {
  const index = state.wishlist.indexOf(productId);
  if (index === -1) {
    state.wishlist.push(productId);
    showToast('Added to wishlist');
  } else {
    state.wishlist.splice(index, 1);
    showToast('Removed from wishlist');
  }

  saveState();
  document.querySelectorAll(`.wishlist-btn[data-id="${productId}"]`).forEach((button) => {
    button.classList.toggle('active', state.wishlist.includes(productId));
  });
}

function login(email, password) {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    state.user = { name: 'Admin', email, role: 'admin' };
    saveState();
    return 'admin';
  }

  if (email && password && password.length >= 6) {
    state.user = { name: email.split('@')[0], email, role: 'user' };
    saveState();
    return 'user';
  }

  return null;
}

function logout() {
  state.user = null;
  saveState();
  window.location.href = `${getBasePrefix()}index.html`;
}

function requireLogin(callback) {
  if (!state.user) {
    openLoginModal();
    return false;
  }

  if (typeof callback === 'function') callback();
  return true;
}

function placeOrder(orderData) {
  const subtotal = getCartTotal();
  const delivery = orderData.delivery ?? 0;
  const order = {
    id: `TG${Date.now().toString().slice(-6)}`,
    items: [...state.cart],
    subtotal,
    delivery,
    total: subtotal + delivery,
    status: 'Confirmed',
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    timestamp: Date.now(),
    address: orderData.address,
    payment: orderData.payment,
    canCancel: true,
    userEmail: state.user?.email || '',
    userName: state.user?.name || 'Customer',
  };

  state.orders.unshift(order);
  state.cart = [];
  saveState();
  upsertRemoteOrder(order).catch((e) => console.warn('Order sync failed', e));
  return order;
}

function cancelOrder(orderId) {
  const order = state.orders.find((entry) => entry.id === orderId);
  if (!order) return false;

  const hoursSince = (Date.now() - order.timestamp) / 3600000;
  if (hoursSince > 24 || order.status === 'Cancelled') return false;

  order.status = 'Cancelled';
  order.canCancel = false;
  saveState();
  upsertRemoteOrder(order).catch((e) => console.warn('Order cancel sync failed', e));
  return true;
}

function renderProductCard(product) {
  const inWishlist = state.wishlist.includes(product.id);
  const savings = product.originalPrice - product.price;
  const offPct = Math.round((savings / product.originalPrice) * 100);
  const quantity = product.quantity !== undefined ? product.quantity : 1;
  const isSoldOut = quantity === 0;

  return `
    <div class="product-card" onclick="${isSoldOut ? 'return false;' : `viewProduct(${product.id})`}" style="${isSoldOut ? 'opacity:0.6; cursor:not-allowed;' : 'cursor:pointer;'}">
      <div class="product-img" style="display:flex; align-items:center; justify-content:center; overflow:hidden;">
        ${renderProductCardMedia(product)}
      </div>
      ${isSoldOut ? '<span class="product-badge" style="background:#dc2626; color:white;">Sold Out</span>' : product.badge ? `<span class="product-badge ${product.badge === 'New' ? 'new' : ''}">${product.badge}</span>` : ''}
      <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${product.id}" onclick="event.stopPropagation(); ${!isSoldOut ? `toggleWishlist(${product.id})` : 'return false;'}" ${isSoldOut ? 'disabled' : ''}>♥</button>
      <div class="product-info">
        <div class="product-brand">${product.brand}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-meta">
          <span class="product-size">${product.size}</span>
          <span class="product-condition">● ${product.condition}</span>
        </div>
        <div class="product-price">
          <span class="price-current">₹${product.price.toLocaleString('en-IN')}</span>
          <span class="price-original">₹${product.originalPrice.toLocaleString('en-IN')}</span>
          <span class="price-off">${offPct}% off</span>
        </div>
      </div>
    </div>
  `;
}

function viewProduct(id) {
  window.location.href = `${getBasePrefix()}pages/product.html?id=${id}`;
}

function renderNav(activePage = '') {
  const user = state.user;
  return `
    <nav>
      <a href="../index.html" class="nav-logo">Thread<span>Gold</span></a>
      <div class="nav-toggle" onclick="toggleMobileNav()">☰</div>
      <div class="nav-links">
        <a href="../index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="../pages/shop.html" class="${activePage === 'shop' ? 'active' : ''}">Shop</a>
        <a href="../pages/orders.html" class="${activePage === 'orders' ? 'active' : ''}">My Orders</a>
        ${user?.role === 'admin' ? '<a href="../admin/dashboard.html" style="color:var(--gold);">⚙ Admin</a>' : ''}
      </div>
      <div class="nav-actions">
        <button class="nav-icon" onclick="openCart()" title="Cart">
          🛍️
          <span class="badge" id="cartBadge" style="display:none;">0</span>
        </button>
        ${user ? `
          <button class="nav-icon" title="${user.name}" onclick="openLogoutModal()" style="font-size:13px; letter-spacing:0.5px; width:auto; padding:0 14px; border-radius:20px; gap:6px;">
            👤 ${user.name}
          </button>
        ` : `
          <button class="btn btn-gold btn-sm" onclick="openLoginModal()">Sign In</button>
        `}
      </div>
    </nav>
  `;
}

function renderRootNav(activePage = '') {
  const user = state.user;
  return `
    <nav>
      <a href="index.html" class="nav-logo">Thread<span>Gold</span></a>
      <div class="nav-toggle" onclick="toggleMobileNav()">☰</div>
      <div class="nav-links">
        <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="pages/shop.html" class="${activePage === 'shop' ? 'active' : ''}">Shop</a>
        <a href="pages/orders.html" class="${activePage === 'orders' ? 'active' : ''}">My Orders</a>
        ${user?.role === 'admin' ? '<a href="admin/dashboard.html" style="color:var(--gold);">⚙ Admin</a>' : ''}
      </div>
      <div class="nav-actions">
        <button class="nav-icon" onclick="openCart()" title="Cart">
          🛍️
          <span class="badge" id="cartBadge" style="display:none;">0</span>
        </button>
        ${user ? `
          <button class="nav-icon" title="${user.name}" onclick="openLogoutModal()" style="font-size:13px; letter-spacing:0.5px; width:auto; padding:0 14px; border-radius:20px; gap:6px;">
            👤 ${user.name}
          </button>
        ` : `
          <button class="btn btn-gold btn-sm" onclick="openLoginModal()">Sign In</button>
        `}
      </div>
    </nav>
  `;
}

function openLoginModal() {
  document.getElementById('loginModal')?.classList.add('open');
}

function toggleMobileNav() {
  const navLinks = document.querySelector('nav .nav-links');
  navLinks?.classList.toggle('open');
}

function closeLoginModal() {
  document.getElementById('loginModal')?.classList.remove('open');
}

function handleLogin() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPass')?.value;
  const role = login(email, password);

  if (!role) {
    showToast('Invalid credentials. Try again.', 'error');
    return;
  }

  closeLoginModal();
  showToast(`Welcome back, ${state.user.name}!`, 'success');
  setTimeout(() => window.location.reload(), 800);
}

function getCartHTML() {
  return `
    <div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
    <div class="cart-panel" id="cartPanel">
      <div class="cart-header">
        <h3>Your Cart</h3>
        <button class="cart-close" onclick="closeCart()">×</button>
      </div>
      <div class="cart-items" id="cartItemsList"></div>
      <div class="cart-footer">
        <div class="cart-total">
          <span class="cart-total-label">Total</span>
          <span class="cart-total-amount" id="cartTotal">₹0</span>
        </div>
        <button class="btn btn-gold btn-full" onclick="goCheckout()">Proceed to Checkout →</button>
      </div>
    </div>
  `;
}

function getLoginModalHTML() {
  return `
    <div class="modal-overlay" id="loginModal">
      <div class="modal">
        <div class="modal-title">Welcome Back</div>
        <div class="modal-subtitle">Sign in to continue shopping</div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-input" type="email" id="loginEmail" placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" type="password" id="loginPass" placeholder="password">
        </div>
        <button class="btn btn-gold btn-full" onclick="handleLogin()">Sign In</button>
        <button class="btn btn-dark btn-full mt-12" onclick="handleRegister()">Create Account</button>
        <button style="display:block;margin-top:16px;background:none;border:none;color:var(--muted);cursor:pointer;font-size:13px;width:100%;text-align:center;" onclick="closeLoginModal()">Cancel</button>
      </div>
    </div>
  `;
}

function handleRegister() {
  const email = document.getElementById('loginEmail')?.value;
  const password = document.getElementById('loginPass')?.value;

  if (!email || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  if (password.length < 6) {
    showToast('Password must be at least 6 characters', 'error');
    return;
  }

  const role = login(email, password);
  if (!role) return;

  closeLoginModal();
  showToast('Account created successfully!', 'success');
  setTimeout(() => window.location.reload(), 800);
}

function goCheckout() {
  if (!requireLogin()) return;
  if (state.cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }

  closeCart();
  window.location.href = `${getBasePrefix()}pages/checkout.html`;
}

function openLogoutModal() {
  document.getElementById('logoutModal')?.classList.add('open');
}

function closeLogoutModal() {
  document.getElementById('logoutModal')?.classList.remove('open');
}

function confirmLogout() {
  closeLogoutModal();
  logout();
}

function getLogoutModalHTML() {
  return `
    <div class="modal-overlay" id="logoutModal">
      <div class="modal">
        <div class="modal-title">Sign Out</div>
        <div class="modal-subtitle">Are you sure you want to sign out of your account?</div>
        <div style="display:flex; gap:12px; margin-top:32px;">
          <button class="btn btn-danger" onclick="confirmLogout()" style="flex:1;">Yes, Sign Out</button>
          <button class="btn btn-dark" onclick="closeLogoutModal()" style="flex:1;">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartUI();
});

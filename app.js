const CATEGORY_IMAGES = {
  'Steam Momos': './steam.jpg',
  'Fry Momos': './crunchy.jpg',
  'Crunchy Momos': './crunchy.jpg',
  'Rolls': './roll.jpg'
};

    const DEFAULT_MENU = [
      {
        id: 'm1',
        name: 'Soyabean Steam Momos',
        category: 'Steam Momos',
        halfPrice: 20,
        halfPieces: null,
        fullPrice: null,
        fullPieces: null,
        available: true,
        badge: 'Popular'
      },
      {
        id: 'm2',
        name: 'Patta Gobi (Cabbage) Steam Momos',
        category: 'Steam Momos',
        halfPrice: 20,
        halfPieces: null,
        fullPrice: null,
        fullPieces: null,
        available: true,
        badge: 'Classic'
      },
      {
        id: 'm3',
        name: 'Paneer Steam Momos',
        category: 'Steam Momos',
        halfPrice: 30,
        halfPieces: null,
        fullPrice: null,
        fullPieces: null,
        available: true,
        badge: 'Paneer Special'
      },
      {
        id: 'm4',
        name: 'Soyabean Fry Momos',
        category: 'Fry Momos',
        halfPrice: 40,
        halfPieces: 6,
        fullPrice: null,
        fullPieces: null,
        available: true,
        badge: 'Crispy'
      },
      {
        id: 'm5',
        name: 'Paneer Fry Momos',
        category: 'Fry Momos',
        halfPrice: 40,
        halfPieces: 6,
        fullPrice: 70,
        fullPieces: 10,
        available: true,
        badge: 'Best Seller'
      },
      {
        id: 'm6',
        name: 'Crunchy Momos',
        category: 'Crunchy Momos',
        halfPrice: 50,
        halfPieces: 5,
        fullPrice: 110,
        fullPieces: 10,
        available: true,
        badge: 'Extra Kurkure'
      },
      {
        id: 'r1',
        name: 'Veg Crispy Roll',
        category: 'Rolls',
        halfPrice: 30,
        halfPieces: 1,
        fullPrice: null,
        fullPieces: null,
        available: true,
        badge: 'Street Style'
      }
    ];

    const STORAGE_KEY = 'vrindavan_momos_menu_v1';
    const SETTINGS_KEY = 'vrindavan_momos_settings_v1';
    let storeSettings = {
      upiId: 'vrindavanmomos@upi',
      siteUrl: ''
    };

    function loadSettings() {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            storeSettings = { ...storeSettings, ...parsed };
          }
        }
      } catch (e) {}
      const upiEl = document.getElementById('adminUpiId');
      const urlEl = document.getElementById('adminSiteUrl');
      if (upiEl) upiEl.value = storeSettings.upiId || '';
      if (urlEl) urlEl.value = storeSettings.siteUrl || '';
    }

    function saveSettings() {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(storeSettings));
      } catch (e) {}
    }

    function getShareUrl() {
      if (storeSettings.siteUrl && storeSettings.siteUrl.trim()) {
        return storeSettings.siteUrl.trim();
      }
      const href = window.location.href || 'https://vrindavanmomos.pages.dev';
      return href.startsWith('http') ? href : 'https://vrindavanmomos.pages.dev';
    }

    function renderQrCode(containerId, text, size) {
      const box = document.getElementById(containerId);
      if (!box) return;
      box.innerHTML = '';
      if (window.QRCode) {
        new QRCode(box, {
          text: text,
          width: size,
          height: size,
          colorDark: '#1C120E',
          colorLight: '#FFFFFF',
          correctLevel: QRCode.CorrectLevel.M
        });
      } else {
        box.innerHTML = '<p class="text-xs text-stone-500 p-4">QR preview requires internet connection</p>';
      }
    }
    let menuItems = [];
    let cart = {}; // key: `${id}_${portion}` -> { id, name, portion, price, pieces, qty }
    let activeCategory = 'All';
    let searchQuery = '';
    let adminMode = false;

    function loadMenu() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            menuItems = parsed;
            return;
          }
        }
      } catch (e) {}
      menuItems = JSON.parse(JSON.stringify(DEFAULT_MENU));
    }

    function saveMenu() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(menuItems));
      } catch (e) {}
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      toastMsg.textContent = msg;
      toast.classList.remove('hidden');
      clearTimeout(window._toastTimer);
      window._toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
      }, 2400);
    }

    function renderMenu() {
      const grid = document.getElementById('menuGrid');
      const empty = document.getElementById('emptyState');

      const filtered = menuItems.filter(item => {
        if (!item.available && !adminMode) return false;
        const matchCat = activeCategory === 'All' || item.category === activeCategory;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        return matchCat && matchSearch;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden');
        return;
      }
      empty.classList.add('hidden');

      grid.innerHTML = filtered.map(item => {
        const imgSrc = CATEGORY_IMAGES[item.category] || CATEGORY_IMAGES['Steam Momos'];
        const isRoll = item.category === 'Rolls';
        const halfLabel = isRoll ? 'Single' : 'Half Plate';
        const halfPcsText = item.halfPieces ? `${item.halfPieces} ${item.halfPieces === 1 ? 'pc' : 'pcs'}` : 'Pieces via Admin';
        const fullPcsText = item.fullPieces ? `${item.fullPieces} pcs` : 'Pieces via Admin';

        return `
          <article class="bg-white rounded-2xl border ${item.available ? 'border-stone-200' : 'border-red-200 opacity-65'} overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
            <div class="relative aspect-[4/3] bg-stone-100 overflow-hidden">
              <img src="${imgSrc}" alt="${escapeHtml(item.name)}" class="w-full h-full object-cover" />
              <div class="absolute top-3 left-3 flex gap-1.5">
                <span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#1C120E]/85 text-amber-300 backdrop-blur">${escapeHtml(item.category)}</span>
                ${item.badge ? `<span class="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-500 text-white">${escapeHtml(item.badge)}</span>` : ''}
              </div>
              ${!item.available ? `<div class="absolute inset-0 bg-black/50 flex items-center justify-center"><span class="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">Out of Stock</span></div>` : ''}
            </div>

            <div class="p-4 flex-1 flex flex-col justify-between gap-4">
              <div>
                <h3 class="font-extrabold text-base text-stone-900 leading-snug">${escapeHtml(item.name)}</h3>
              </div>

              <div class="space-y-2">
                ${item.halfPrice ? `
                  <div class="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70">
                    <div>
                      <span class="text-xs font-bold text-stone-800 block">${halfLabel}</span>
                      <span class="text-[11px] text-stone-500">${halfPcsText}</span>
                    </div>
                    <div class="flex items-center gap-2.5">
                      <span class="font-extrabold text-sm text-stone-900">₹${item.halfPrice}</span>
                      <button type="button" ${!item.available ? 'disabled' : ''} data-add-id="${item.id}" data-portion="${halfLabel}" class="add-cart-btn px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white text-xs font-bold transition cursor-pointer">
                        + Add
                      </button>
                    </div>
                  </div>
                ` : ''}

                ${item.fullPrice ? `
                  <div class="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div>
                      <span class="text-xs font-bold text-stone-800 block">Full Plate</span>
                      <span class="text-[11px] text-stone-500">${fullPcsText}</span>
                    </div>
                    <div class="flex items-center gap-2.5">
                      <span class="font-extrabold text-sm text-stone-900">₹${item.fullPrice}</span>
                      <button type="button" ${!item.available ? 'disabled' : ''} data-add-id="${item.id}" data-portion="Full Plate" class="add-cart-btn px-3 py-1.5 rounded-lg bg-[#1C120E] hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-bold transition cursor-pointer">
                        + Add
                      </button>
                    </div>
                  </div>
                ` : `
                  <div class="text-[11px] text-stone-400 px-1 italic">
                    ${isRoll ? 'Single serving item' : 'Full plate price Admin Mode se set kar sakte hain'}
                  </div>
                `}
              </div>
            </div>
          </article>
        `;
      }).join('');

      document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-add-id');
          const portion = btn.getAttribute('data-portion');
          addToCart(id, portion);
        });
      });
    }

    function renderAdminTable() {
      const tbody = document.getElementById('adminTableBody');
      tbody.innerHTML = menuItems.map(item => `
        <tr class="hover:bg-amber-50/40">
          <td class="py-2 px-3 font-semibold text-stone-900 min-w-[160px]">
            <input type="text" value="${escapeHtml(item.name)}" data-edit-id="${item.id}" data-field="name" class="admin-input w-full px-2 py-1 rounded-lg border border-stone-200 text-xs font-semibold" />
          </td>
          <td class="py-2 px-3">
            <select data-edit-id="${item.id}" data-field="category" class="admin-input px-2 py-1 rounded-lg border border-stone-200 text-xs bg-white">
              ${['Steam Momos', 'Fry Momos', 'Crunchy Momos', 'Rolls'].map(cat => `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
          </td>
          <td class="py-2 px-3 w-20">
            <input type="number" min="0" value="${item.halfPrice ?? ''}" placeholder="—" data-edit-id="${item.id}" data-field="halfPrice" class="admin-input w-16 px-2 py-1 rounded-lg border border-stone-200 text-xs" />
          </td>
          <td class="py-2 px-3 w-20">
            <input type="number" min="0" value="${item.halfPieces ?? ''}" placeholder="—" data-edit-id="${item.id}" data-field="halfPieces" class="admin-input w-16 px-2 py-1 rounded-lg border border-stone-200 text-xs" />
          </td>
          <td class="py-2 px-3 w-20">
            <input type="number" min="0" value="${item.fullPrice ?? ''}" placeholder="—" data-edit-id="${item.id}" data-field="fullPrice" class="admin-input w-16 px-2 py-1 rounded-lg border border-stone-200 text-xs" />
          </td>
          <td class="py-2 px-3 w-20">
            <input type="number" min="0" value="${item.fullPieces ?? ''}" placeholder="—" data-edit-id="${item.id}" data-field="fullPieces" class="admin-input w-16 px-2 py-1 rounded-lg border border-stone-200 text-xs" />
          </td>
          <td class="py-2 px-3">
            <button type="button" data-toggle-id="${item.id}" class="toggle-avail-btn px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${item.available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}">
              ${item.available ? 'Available' : 'Out'}
            </button>
          </td>
          <td class="py-2 px-3 text-right">
            <button type="button" data-delete-id="${item.id}" class="delete-item-btn p-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer" title="Delete item">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.admin-input').forEach(el => {
        el.addEventListener('change', () => {
          const id = el.getAttribute('data-edit-id');
          const field = el.getAttribute('data-field');
          const item = menuItems.find(m => m.id === id);
          if (!item) return;
          if (field === 'name' || field === 'category') {
            item[field] = el.value.trim() || item[field];
          } else {
            const num = parseInt(el.value, 10);
            item[field] = Number.isFinite(num) && num > 0 ? num : null;
          }
          saveMenu();
          renderMenu();
          showToast('Menu updated!');
        });
      });

      document.querySelectorAll('.toggle-avail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-toggle-id');
          const item = menuItems.find(m => m.id === id);
          if (!item) return;
          item.available = !item.available;
          saveMenu();
          renderAdminTable();
          renderMenu();
          showToast(item.available ? `${item.name} is now Available` : `${item.name} marked Out of Stock`);
        });
      });

      document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-delete-id');
          menuItems = menuItems.filter(m => m.id !== id);
          saveMenu();
          renderAdminTable();
          renderMenu();
          showToast('Item removed');
        });
      });

      if (window.lucide) lucide.createIcons();
    }

    function addToCart(id, portion) {
      const item = menuItems.find(m => m.id === id);
      if (!item) return;
      const isFull = portion === 'Full Plate';
      const price = isFull ? item.fullPrice : item.halfPrice;
      const pieces = isFull ? item.fullPieces : item.halfPieces;
      if (!price) return;

      const key = `${id}_${portion}`;
      if (!cart[key]) {
        cart[key] = { id, name: item.name, portion, price, pieces, qty: 0 };
      }
      cart[key].qty += 1;
      updateCartUI();
      showToast(`Added ${item.name} (${portion})`);
    }

    function updateCartUI() {
      const entries = Object.entries(cart);
      const totalQty = entries.reduce((acc, [, v]) => acc + v.qty, 0);
      const totalAmount = entries.reduce((acc, [, v]) => acc + v.price * v.qty, 0);

      document.getElementById('cartCountBadge').textContent = totalQty;
      document.getElementById('cartTotalAmount').textContent = `₹${totalAmount}`;

      const container = document.getElementById('cartItemsContainer');
      if (entries.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-stone-400 text-sm">Aapka order abhi khali hai. Menu se momos ya roll add karein!</div>`;
        return;
      }

      container.innerHTML = entries.map(([key, item]) => `
        <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
          <div class="min-w-0">
            <p class="font-bold text-sm text-stone-900 truncate">${escapeHtml(item.name)}</p>
            <p class="text-xs text-stone-500">${escapeHtml(item.portion)}${item.pieces ? ` (${item.pieces} pcs)` : ''} • ₹${item.price}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button type="button" data-cart-dec="${key}" class="cart-dec w-7 h-7 rounded-lg bg-white border border-stone-300 font-bold text-sm cursor-pointer">-</button>
            <span class="w-5 text-center font-bold text-sm">${item.qty}</span>
            <button type="button" data-cart-inc="${key}" class="cart-inc w-7 h-7 rounded-lg bg-white border border-stone-300 font-bold text-sm cursor-pointer">+</button>
          </div>
        </div>
      `).join('');

      document.querySelectorAll('.cart-dec').forEach(btn => {
        btn.addEventListener('click', () => {
          const k = btn.getAttribute('data-cart-dec');
          if (cart[k]) {
            cart[k].qty -= 1;
            if (cart[k].qty <= 0) delete cart[k];
            updateCartUI();
          }
        });
      });

      document.querySelectorAll('.cart-inc').forEach(btn => {
        btn.addEventListener('click', () => {
          const k = btn.getAttribute('data-cart-inc');
          if (cart[k]) {
            cart[k].qty += 1;
            updateCartUI();
          }
        });
      });
    }

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    // Event Listeners
    document.getElementById('toggleAdminBtn').addEventListener('click', () => {
      adminMode = !adminMode;
      document.getElementById('adminPanel').classList.toggle('hidden', !adminMode);
      document.getElementById('adminBtnLabel').textContent = adminMode ? 'Exit Admin' : 'Admin Mode';
      if (adminMode) renderAdminTable();
      renderMenu();
    });

    document.getElementById('closeAdminBtn').addEventListener('click', () => {
      adminMode = false;
      document.getElementById('adminPanel').classList.add('hidden');
      document.getElementById('adminBtnLabel').textContent = 'Admin Mode';
      renderMenu();
    });

    document.getElementById('resetMenuBtn').addEventListener('click', () => {
      menuItems = JSON.parse(JSON.stringify(DEFAULT_MENU));
      saveMenu();
      renderAdminTable();
      renderMenu();
      showToast('Default menu restored!');
    });

    document.getElementById('addItemForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('newName').value.trim();
      const category = document.getElementById('newCategory').value;
      const halfPrice = parseInt(document.getElementById('newHalfPrice').value, 10) || null;
      const halfPieces = parseInt(document.getElementById('newHalfPieces').value, 10) || null;
      const fullPrice = parseInt(document.getElementById('newFullPrice').value, 10) || null;
      const fullPieces = parseInt(document.getElementById('newFullPieces').value, 10) || null;

      if (!name) return;
      menuItems.push({
        id: 'item_' + Date.now(),
        name,
        category,
        halfPrice,
        halfPieces,
        fullPrice,
        fullPieces,
        available: true,
        badge: 'New'
      });
      saveMenu();
      e.target.reset();
      renderAdminTable();
      renderMenu();
      showToast(`Added "${name}" to menu!`);
    });

    document.querySelectorAll('.cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeCategory = tab.getAttribute('data-category');
        document.querySelectorAll('.cat-tab').forEach(t => {
          t.className = 'cat-tab px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white border border-stone-200 text-stone-700 hover:border-orange-400 shrink-0 cursor-pointer transition';
        });
        tab.className = 'cat-tab px-4 py-2 rounded-full text-xs sm:text-sm font-bold bg-[#1C120E] text-white shrink-0 cursor-pointer transition';
        renderMenu();
      });
    });

    document.getElementById('searchInput').addEventListener('input', e => {
      searchQuery = e.target.value;
      renderMenu();
    });

    document.getElementById('openCartBtn').addEventListener('click', () => {
      document.getElementById('cartDrawer').classList.remove('hidden');
    });

    document.getElementById('closeCartBtn').addEventListener('click', () => {
      document.getElementById('cartDrawer').classList.add('hidden');
    });

    document.getElementById('copyOrderBtn').addEventListener('click', () => {
      const entries = Object.values(cart);
      if (entries.length === 0) {
        showToast('Order khali hai!');
        return;
      }
      const total = entries.reduce((acc, i) => acc + i.price * i.qty, 0);
      const text = 'Vrindavan Momos Order:\n' +
        entries.map(i => `- ${i.name} (${i.portion}) x${i.qty} = ₹${i.price * i.qty}`).join('\n') +
        `\nTotal: ₹${total}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('Order copied!')).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    });

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('Order copied!'); } catch (e) {}
      document.body.removeChild(ta);
    }

    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      const upi = document.getElementById('adminUpiId').value.trim();
      const url = document.getElementById('adminSiteUrl').value.trim();
      if (upi) storeSettings.upiId = upi;
      storeSettings.siteUrl = url;
      saveSettings();
      showToast('UPI & QR settings saved!');
    });

    document.getElementById('openMenuQrBtn').addEventListener('click', () => {
      const url = getShareUrl();
      document.getElementById('menuQrUrlText').textContent = url;
      renderQrCode('menuQrBox', url, 190);
      document.getElementById('menuQrModal').classList.remove('hidden');
    });

    document.getElementById('closeMenuQrBtn').addEventListener('click', () => {
      document.getElementById('menuQrModal').classList.add('hidden');
    });

    document.getElementById('copySiteUrlBtn').addEventListener('click', () => {
      const url = getShareUrl();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => showToast('Website link copied!')).catch(() => fallbackCopy(url));
      } else {
        fallbackCopy(url);
      }
    });

    document.getElementById('printQrBtn').addEventListener('click', () => {
      window.print();
    });

    document.getElementById('backToCartBtn').addEventListener('click', () => {
      document.getElementById('upiPaymentView').classList.add('hidden');
      document.getElementById('cartItemsContainer').classList.remove('hidden');
      document.getElementById('cartFooter').classList.remove('hidden');
    });

    document.getElementById('copyUpiBtn').addEventListener('click', () => {
      const upi = storeSettings.upiId || 'vrindavanmomos@upi';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upi).then(() => showToast('UPI ID copied!')).catch(() => fallbackCopy(upi));
      } else {
        fallbackCopy(upi);
      }
    });

    document.getElementById('markPaidBtn').addEventListener('click', () => {
      cart = {};
      updateCartUI();
      document.getElementById('upiPaymentView').classList.add('hidden');
      document.getElementById('cartItemsContainer').classList.remove('hidden');
      document.getElementById('cartFooter').classList.remove('hidden');
      document.getElementById('cartDrawer').classList.add('hidden');
      showToast('Dhanyawad! Aapka order confirm ho gaya hai.');
    });

    document.getElementById('placeOrderBtn').addEventListener('click', () => {
      const entries = Object.values(cart);
      if (entries.length === 0) {
        showToast('Pehle menu se item add karein!');
        return;
      }
      const total = entries.reduce((acc, i) => acc + i.price * i.qty, 0);
      const upiId = storeSettings.upiId || 'vrindavanmomos@upi';
      const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent('Vrindavan Momos')}&am=${total}&cu=INR&tn=${encodeURIComponent('Momos Order')}`;
      document.getElementById('upiPayAmount').textContent = `₹${total}`;
      document.getElementById('upiIdDisplay').textContent = upiId;
      document.getElementById('upiDeepLinkBtn').setAttribute('href', upiUri);
      renderQrCode('upiQrBox', upiUri, 190);
      document.getElementById('cartItemsContainer').classList.add('hidden');
      document.getElementById('cartFooter').classList.add('hidden');
      document.getElementById('upiPaymentView').classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    });

    // Init
    loadSettings();
    loadMenu();
    renderMenu();
    updateCartUI();
    if (window.lucide) lucide.createIcons();

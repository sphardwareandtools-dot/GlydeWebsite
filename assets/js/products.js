(async function(){
  const WA_NUMBER = "918149066661"; // international format (91 + 8149066661)
  const WA_BASE = `https://wa.me/${WA_NUMBER}?text=Hello%20Glyde%20Curtain%20Tracks`;

  async function loadJSON(){
    const res = await fetch('products.json');
    if(!res.ok) throw new Error('Failed to load products.json');
    return res.json();
  }

  function formatCurrency(n){ return "₹" + n; }

  // Utilities
  function computeMinPrice(product){
    if(!product.pricing) return 0;
    let min = Infinity;
    Object.values(product.pricing).forEach(sizeObj=>{
      Object.values(sizeObj).forEach(v=>{
        if(typeof v === 'number') min = Math.min(min, v);
      });
    });
    return min === Infinity ? 0 : min;
  }

  // Render product card
  function makeCard(p){
    const card = document.createElement('article');
    card.className = 'card';
    const thumb = p.media && p.media.length ? `media/${p.folder}/${p.media[0]}` : 'assets/images/poster.png';
    const minPrice = computeMinPrice(p);
    card.innerHTML = `
      <a href="product.html?id=${p.id}">
        <img src="${thumb}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="muted">${p.category}</p>
        <div class="price">From ${formatCurrency(minPrice)}</div>
      </a>
    `;
    return card;
  }

  // Product List page
  if(document.getElementById('product-grid')){
    const data = await loadJSON();
    const grid = document.getElementById('product-grid');
    const categorySelect = document.getElementById('category-filter');
    const searchInput = document.getElementById('search-input');

    // Build category list from products.json
    const categories = Array.from(new Set(data.products.map(p=>p.category))).filter(Boolean).sort();
    categories.forEach(cat=>{
      const o = document.createElement('option'); o.value = cat; o.textContent = cat; categorySelect.appendChild(o);
    });

    function renderProducts(){
      const category = categorySelect.value.trim();
      const q = searchInput.value.trim().toLowerCase();
      grid.innerHTML = '';
      const filtered = data.products.filter(p=>{
        if(category && p.category !== category) return false;
        if(q && !p.name.toLowerCase().includes(q)) return false;
        return true;
      });
      if(filtered.length === 0){
        grid.innerHTML = '<p>No products found.</p>';
        return;
      }
      filtered.forEach(p=> grid.appendChild(makeCard(p)));
    }

    categorySelect.addEventListener('change', renderProducts);
    searchInput.addEventListener('input', renderProducts);

    renderProducts();
  }

  // Product detail page
  if(document.getElementById('product-container')){
    const params = new URLSearchParams(location.search);
    const id = Number(params.get('id'));
    const data = await loadJSON();
    const product = data.products.find(x=>x.id===id);
    const container = document.getElementById('product-container');
    if(!product){
      container.innerHTML = '<p>Product not found.</p>';
      return;
    }

    // Build carousel
    const mediaBase = `media/${product.folder}/`;
    const carousel = document.createElement('div'); carousel.className='carousel';
    const main = document.createElement('div'); main.className='carousel-main';
    const thumbs = document.createElement('div'); thumbs.className='thumbs';
    let currentIndex = 0;

    function renderMain(){
      const m = product.media && product.media[currentIndex];
      main.innerHTML = '';
      if(!m) return;
      const ext = m.split('.').pop().toLowerCase();
      if(['mp4','webm','ogg'].includes(ext)){
        const v = document.createElement('video');
        v.controls = true;
        v.src = mediaBase + m;
        main.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = mediaBase + m;
        img.alt = product.name;
        main.appendChild(img);
      }
      const t = thumbs.children[currentIndex];
      if(t) t.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});
    }

    (product.media || []).forEach((m, idx)=>{
      const t = document.createElement('div'); t.className='thumb';
      if(m.match(/\.(mp4|webm|ogg)$/i)){
        t.innerHTML = `<video src="${mediaBase+m}" muted></video>`;
      } else {
        t.innerHTML = `<img src="${mediaBase+m}" alt="">`;
      }
      t.addEventListener('click', ()=>{ currentIndex = idx; renderMain(); });
      thumbs.appendChild(t);
    });

    carousel.appendChild(main);
    carousel.appendChild(thumbs);

    // controls: title, description, size/color selects, price, contact
    const meta = document.createElement('div');
    meta.className = 'meta';
    const sizeSelect = document.createElement('select'); sizeSelect.className='select';
    const colorSelect = document.createElement('select'); colorSelect.className='select';
    (product.sizes || []).forEach(s=>{ const o=document.createElement('option'); o.value=o.text=s; sizeSelect.appendChild(o);});
    (product.colors || []).forEach(c=>{ const o=document.createElement('option'); o.value=o.text=c; colorSelect.appendChild(o);});

    const priceBox = document.createElement('div'); priceBox.className='price';
    function updatePrice(){
      const size = sizeSelect.value;
      const color = colorSelect.value;
      const p = (product.pricing && product.pricing[size] && product.pricing[size][color]) || null;
      priceBox.textContent = p ? `Price: ${formatCurrency(p)}` : 'Contact for price';
    }
    sizeSelect.addEventListener('change', updatePrice);
    colorSelect.addEventListener('change', updatePrice);

    // WhatsApp button for this product
    const waBtn = document.createElement('a');
    waBtn.className = 'btn btn-whatsapp';
    waBtn.target = '_blank';
    waBtn.rel = 'noopener';
    const msg = encodeURIComponent(`Hello, I'm interested in ${product.name} (ID:${product.id}). Please share details.`);
    waBtn.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    waBtn.textContent = 'Contact on WhatsApp';

    meta.innerHTML = `<h2>${product.name}</h2><p class="description">${product.description}</p>`;
    if(product.caption){ const c = document.createElement('p'); c.className='caption'; c.textContent = product.caption; meta.appendChild(c); }
    meta.appendChild(sizeSelect);
    meta.appendChild(colorSelect);
    meta.appendChild(priceBox);
    meta.appendChild(document.createElement('br'));
    meta.appendChild(waBtn);

    container.appendChild(carousel);
    container.appendChild(meta);

    renderMain();
    updatePrice();

    // top whatsapp link
    const topWa = document.getElementById('whatsapp-top');
    if(topWa) topWa.href = `https://wa.me/${WA_NUMBER}?text=Hello%20Glyde%20Curtain%20Tracks`;
  }

})();

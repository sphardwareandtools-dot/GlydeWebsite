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
    if(typeof product.pricing === 'number') return product.pricing;
    let min = Infinity;
    Object.values(product.pricing).forEach(sizeObj=>{
      if(typeof sizeObj === 'number') min = Math.min(min, sizeObj);
      else if(typeof sizeObj === 'object'){
        Object.values(sizeObj).forEach(v=>{ if(typeof v === 'number') min = Math.min(min, v); });
      }
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
    const categoryButtons = document.getElementById('category-buttons');
    const searchInput = document.getElementById('search-input');

    // Build category list from products.json (unique, sorted)
    const categories = Array.from(new Set(data.products.map(p=>p.category))).filter(Boolean).sort();

    // selected category state
    let selectedCategory = '';

    function buildCategoryButtons(){
      categoryButtons.innerHTML = '';
      // All button
      const allBtn = document.createElement('button');
      allBtn.type = 'button';
      allBtn.className = 'category-btn active';
      allBtn.textContent = 'All';
      allBtn.dataset.category = '';
      allBtn.addEventListener('click', ()=>{ selectCategory(''); });
      categoryButtons.appendChild(allBtn);

      categories.forEach(cat=>{
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'category-btn';
        b.textContent = cat;
        b.dataset.category = cat;
        b.addEventListener('click', ()=>{ selectCategory(cat); });
        categoryButtons.appendChild(b);
      });
    }

    function selectCategory(cat){
      selectedCategory = cat;
      // update active classes
      Array.from(categoryButtons.children).forEach(btn=>{
        btn.classList.toggle('active', btn.dataset.category === cat);
      });
      renderProducts();
    }

    function renderProducts(){
      const q = searchInput.value.trim().toLowerCase();
      grid.innerHTML = '';
      const filtered = data.products.filter(p=>{
        if(selectedCategory && p.category !== selectedCategory) return false;
        if(q && !p.name.toLowerCase().includes(q)) return false;
        return true;
      });
      if(filtered.length === 0){
        grid.innerHTML = '<p>No products found.</p>';
        return;
      }
      filtered.forEach(p=> grid.appendChild(makeCard(p)));
    }

    // wire events
    buildCategoryButtons();
    searchInput.addEventListener('input', renderProducts);

    renderProducts();
  }

  // Product detail page (unchanged)
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

    // Build product row (gallery + meta)
    const row = document.createElement('div'); row.className = 'product-row';

    // Build carousel
    const mediaBase = `media/${product.folder}/`;
    const carouselWrap = document.createElement('div');
    carouselWrap.className = 'carousel';
    const main = document.createElement('div'); main.className='carousel-main';
    const thumbs = document.createElement('div'); thumbs.className='thumbs';
    let currentIndex = 0;

    function renderMain(){
      const m = product.media && product.media[currentIndex];
      main.innerHTML = '';
      if(!m){
        const placeholder = document.createElement('div'); placeholder.style.height='260px'; placeholder.style.display='flex'; placeholder.style.alignItems='center'; placeholder.style.justifyContent='center'; placeholder.textContent='No media'; placeholder.style.color='#ccc'; main.appendChild(placeholder);
        return;
      }
      const ext = m.split('.').pop().toLowerCase();
      if(['mp4','webm','ogg'].includes(ext)){
        const v = document.createElement('video');
        v.controls = true;
        v.src = mediaBase + m;
        v.style.maxWidth='100%';
        main.appendChild(v);
      } else {
        const img = document.createElement('img');
        img.src = mediaBase + m;
        img.alt = product.name + (product.caption ? ' - ' + product.caption : '');
        main.appendChild(img);
      }
      // mark selected thumb
      Array.from(thumbs.children).forEach((t, i)=> t.classList.toggle('selected', i===currentIndex));
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

    carouselWrap.appendChild(main);
    carouselWrap.appendChild(thumbs);

    // Build meta panel
    const meta = document.createElement('aside'); meta.className='meta';
    const title = document.createElement('h2'); title.textContent = product.name;
    const desc = document.createElement('p'); desc.className='description'; desc.textContent = product.description || '';
    meta.appendChild(title);
    meta.appendChild(desc);
    if(product.caption){ const c = document.createElement('p'); c.className='caption'; c.textContent = product.caption; meta.appendChild(c); }

    // size/color selectors
    const specs = document.createElement('div'); specs.className='specs';
    const sizeSelect = document.createElement('select'); sizeSelect.className='select';
    (product.sizes || []).forEach(s=>{ const o=document.createElement('option'); o.value=o.text=s; sizeSelect.appendChild(o);});
    const colorSelect = document.createElement('select'); colorSelect.className='select';
    (product.colors || []).forEach(c=>{ const o=document.createElement('option'); o.value=o.text=c; colorSelect.appendChild(o);});
    specs.appendChild(sizeSelect); specs.appendChild(colorSelect);
    meta.appendChild(specs);

    // price box
    const priceBox = document.createElement('div'); priceBox.className='price-box';
    const priceLabel = document.createElement('div'); priceLabel.className='price-label';
    function computePrice(product, size, color){
      if(!product || product.pricing == null) return null;
      if(typeof product.pricing === 'number') return product.pricing;
      if(typeof product.pricing === 'object'){
        if(size && product.pricing[size] != null){
          const v = product.pricing[size];
          if(typeof v === 'number') return v;
          if(color && typeof v === 'object' && v[color] != null && typeof v[color] === 'number') return v[color];
        }
        const flatNumbers = [];
        Object.values(product.pricing).forEach(val=>{
          if(typeof val === 'number') flatNumbers.push(val);
          else if(typeof val === 'object'){
            Object.values(val).forEach(v2=>{ if(typeof v2 === 'number') flatNumbers.push(v2); });
          }
        });
        if(flatNumbers.length) return Math.min(...flatNumbers);
      }
      return null;
    }
    const minP = computeMinPrice(product);
    priceLabel.textContent = 'Price: ' + (minP ? formatCurrency(minP) : 'Contact');
    const waBtn = document.createElement('a'); waBtn.className='btn-large'; waBtn.target='_blank'; waBtn.rel='noopener';
    const msg = encodeURIComponent(`Hello, I'm interested in ${product.name} (ID:${product.id}). Please share details.`);
    waBtn.href = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    waBtn.textContent = 'Contact on WhatsApp';
    priceBox.appendChild(priceLabel); priceBox.appendChild(waBtn);
    meta.appendChild(priceBox);

    // wire price updates
    function updatePrice(){
      const size = sizeSelect.value;
      const color = colorSelect.value;
      const p = computePrice(product, size, color);
      priceLabel.textContent = p ? `Price: ${formatCurrency(p)}` : 'Price: Contact';
    }
    sizeSelect.addEventListener('change', updatePrice);
    colorSelect.addEventListener('change', updatePrice);

    // assemble
    row.appendChild(carouselWrap);
    row.appendChild(meta);
    container.appendChild(row);

    renderMain();
    updatePrice();

    // top whatsapp link
    const topWa = document.getElementById('whatsapp-top');
    if(topWa) topWa.href = `https://wa.me/${WA_NUMBER}?text=Hello%20Glyde%20Curtain%20Tracks`;
  }

})();

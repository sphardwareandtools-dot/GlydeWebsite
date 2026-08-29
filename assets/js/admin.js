(async function(){
  // Admin JS: load products.json, allow add/edit/delete, export updated JSON and create zip scaffold
  const prodList = document.getElementById('prodList');
  const jsonView = document.getElementById('jsonView');
  const reloadBtn = document.getElementById('reloadBtn');
  const exportBtn = document.getElementById('exportBtn');
  const zipBtn = document.getElementById('zipBtn');

  const addBtn = document.getElementById('addBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const loadJsonBtn = document.getElementById('loadJsonBtn');
  const clearBtn = document.getElementById('clearBtn');
  const notice = document.getElementById('notice');

  // form fields
  const fId = document.getElementById('p-id');
  const fName = document.getElementById('p-name');
  const fCategory = document.getElementById('p-category');
  const fFolder = document.getElementById('p-folder');
  const fMedia = document.getElementById('p-media');
  const fSizes = document.getElementById('p-sizes');
  const fColors = document.getElementById('p-colors');
  const fDesc = document.getElementById('p-description');
  const fPricing = document.getElementById('p-pricing');

  let productsData = { products: [] };

  async function loadProducts(){
    try{
      const res = await fetch('products.json?_=' + Date.now());
      if(!res.ok) throw new Error('Failed to load products.json');
      const data = await res.json();
      productsData = data;
      renderList();
      jsonView.textContent = JSON.stringify(productsData, null, 2);
      showNotice('Loaded products.json (' + (productsData.products?productsData.products.length:0) + ' products)');
    }catch(err){
      jsonView.textContent = 'Error loading products.json: ' + err.message;
      showNotice('Error loading products.json: ' + err.message, true);
    }
  }

  function renderList(){
    prodList.innerHTML = '';
    (productsData.products || []).forEach(p=>{
      const card = document.createElement('div'); card.className='prod-card';
      card.innerHTML = `
        <strong>${escapeHtml(p.name || '(no name)')}</strong><br>
        <small>id: ${p.id} • ${escapeHtml(p.category||'')}</small>
        <div style="margin-top:8px">${escapeHtml((p.description||'').slice(0,120))}${(p.description||'').length>120?'…':''}</div>
        <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button data-id="${p.id}" class="editBtn btn">Edit</button>
          <button data-id="${p.id}" class="dupBtn btn">Duplicate</button>
        </div>
      `;
      prodList.appendChild(card);
    });

    // attach handlers
    Array.from(document.getElementsByClassName('editBtn')).forEach(b=>b.addEventListener('click', e=>{
      const id = Number(e.currentTarget.dataset.id); loadToForm(id);
    }));
    Array.from(document.getElementsByClassName('dupBtn')).forEach(b=>b.addEventListener('click', e=>{
      const id = Number(e.currentTarget.dataset.id); duplicateProduct(id);
    }));
  }

  function loadToForm(id){
    const p = (productsData.products || []).find(x=>Number(x.id)===Number(id));
    if(!p) return;
    fId.value = p.id;
    fName.value = p.name || '';
    fCategory.value = p.category || '';
    fFolder.value = p.folder || '';
    fMedia.value = (p.media || []).join(', ');
    fSizes.value = (p.sizes || []).join(', ');
    fColors.value = (p.colors || []).join(', ');
    fDesc.value = p.description || '';
    // Support both numeric and object pricing
    if(typeof p.pricing === 'number') fPricing.value = String(p.pricing);
    else fPricing.value = p.pricing ? JSON.stringify(p.pricing) : '';
    showNotice('Loaded product ' + p.name);
  }

  function clearForm(){
    fId.value=''; fName.value=''; fCategory.value=''; fFolder.value=''; fMedia.value=''; fSizes.value=''; fColors.value=''; fDesc.value=''; fPricing.value='';
    showNotice('Form cleared');
  }

  function saveFromForm(){
    // build product
    const id = Number(fId.value) || Date.now();
    const pricingVal = parsePricing(fPricing.value.trim());
    const product = {
      id: id,
      name: fName.value.trim(),
      category: fCategory.value.trim(),
      folder: fFolder.value.trim() || ('p' + id),
      media: fMedia.value.trim() ? fMedia.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      sizes: fSizes.value.trim() ? fSizes.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      colors: fColors.value.trim() ? fColors.value.split(',').map(s=>s.trim()).filter(Boolean) : [],
      description: fDesc.value.trim(),
      pricing: pricingVal
    };

    // replace or add
    const idx = (productsData.products || []).findIndex(x=>Number(x.id)===Number(id));
    if(idx >= 0){
      productsData.products[idx] = product;
      showNotice('Updated product ' + product.name);
    } else {
      productsData.products.push(product);
      showNotice('Added product ' + product.name);
    }
    renderList();
    jsonView.textContent = JSON.stringify(productsData, null, 2);
  }

  function deleteFromForm(){
    const id = Number(fId.value);
    if(!id) return showNotice('No product id set', true);
    const idx = (productsData.products || []).findIndex(x=>Number(x.id)===id);
    if(idx === -1) return showNotice('Product not found', true);
    const name = productsData.products[idx].name;
    productsData.products.splice(idx,1);
    clearForm();
    renderList();
    jsonView.textContent = JSON.stringify(productsData, null, 2);
    showNotice('Deleted product ' + name);
  }

  function duplicateProduct(id){
    const p = (productsData.products || []).find(x=>Number(x.id)===Number(id));
    if(!p) return;
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = Date.now();
    copy.name = copy.name + ' (copy)';
    // ensure folder unique
    copy.folder = (copy.folder || 'p' + copy.id) + '_' + copy.id;
    productsData.products.push(copy);
    renderList();
    jsonView.textContent = JSON.stringify(productsData, null, 2);
    showNotice('Duplicated product ' + p.name);
  }

  function parsePricing(value){
    if(value === '') return {};
    // If it's a plain number, return number
    if(/^\d+(?:\.\d+)?$/.test(value)) return Number(value);
    try{ return JSON.parse(value); }catch(e){ showNotice('Invalid pricing — expected a number or JSON (saved empty pricing)', true); return {}; }
  }

  function showNotice(msg, isError){
    notice.style.display = 'block';
    notice.textContent = msg;
    notice.style.background = isError ? '#fdecea' : '#eef9ee';
    notice.style.color = isError ? '#8a1f1f' : '#0a6e2f';
    setTimeout(()=>{ notice.style.display = 'none'; }, 4000);
  }

  function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

  // Export JSON: downloads the current productsData as products.json file
  function exportJSON(){
    const blob = new Blob([JSON.stringify(productsData, null, 2)], {type:'application/json'});
    saveAs(blob, 'products.json');
  }

  // Create zip scaffold for media folders
  async function createZip(){
    const zip = new JSZip();
    const base = zip.folder('media');
    (productsData.products || []).forEach(p=>{
      const folderName = p.folder || ('p' + p.id);
      const f = base.folder(folderName);
      // create placeholder files for each media filename or a README
      if((p.media || []).length){
        p.media.forEach(m=>{
          f.file(m, '');
        });
      } else {
        f.file('README.txt', 'Add media files for product: ' + (p.name||''));
      }
    });
    const content = await zip.generateAsync({type:'blob'});
    saveAs(content, 'media-scaffold.zip');
  }

  // wire events
  reloadBtn.addEventListener('click', loadProducts);
  addBtn.addEventListener('click', saveFromForm);
  deleteBtn.addEventListener('click', deleteFromForm);
  loadJsonBtn.addEventListener('click', ()=>{ copyToFormFromJsonEditor(); });
  clearBtn.addEventListener('click', clearForm);
  exportBtn.addEventListener('click', exportJSON);
  zipBtn.addEventListener('click', createZip);

  function copyToFormFromJsonEditor(){
    // Opens the JSON view content and tries to load the first product into form
    if(!productsData.products || !productsData.products.length) return showNotice('No products to load', true);
    const p = productsData.products[0];
    loadToForm(p.id);
  }

  // initial load
  await loadProducts();
})();

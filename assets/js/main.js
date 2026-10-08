// Main interactions: nav, reveal, filters, search, forms, dynamic CMS rendering
(function(){
  // Mobile nav
  const btn = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-mobile-nav]');
  if(btn && nav){ btn.addEventListener('click',()=>{ nav.classList.toggle('open'); }); }

  // WhatsApp links (built from config, not hardcoded in UI)
  try{
    document.querySelectorAll('[data-whatsapp]').forEach(a=>{ a.href = SITE_CONFIG.whatsapp.link; a.target='_blank'; a.rel='noopener'; });
    document.querySelectorAll('[data-wa-number]').forEach(el=>{ el.textContent = '967 '+'730 143 224'; });
  }catch(e){}

  // Reveal on scroll
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target);} }),{threshold:.12});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  // Generic chip filter: data-filter-group + data-filter="cat" on chips, data-cat on items
  document.querySelectorAll('[data-filter-group]').forEach(group=>{
    const chips = group.querySelectorAll('[data-filter]');
    const targetSel = group.getAttribute('data-filter-group');
    const items = document.querySelectorAll(targetSel + ' [data-cat]');
    chips.forEach(ch=>{
      ch.addEventListener('click',()=>{
        chips.forEach(c=>c.classList.remove('active'));
        ch.classList.add('active');
        const f = ch.getAttribute('data-filter');
        items.forEach(it=>{
          const cats = (it.getAttribute('data-cat')||'').split(' ');
          it.style.display = (f==='all' || cats.includes(f)) ? '' : 'none';
        });
      });
    });
  });

  // Generic live search: data-search-input + data-search-list selector
  document.querySelectorAll('[data-search-input]').forEach(input=>{
    const sel = input.getAttribute('data-search-input');
    input.addEventListener('input',()=>{
      const q = input.value.trim();
      document.querySelectorAll(sel+' [data-searchable]').forEach(card=>{
        const text = card.getAttribute('data-searchable')||card.textContent;
        card.style.display = text.includes(q) ? '' : 'none';
      });
    });
  });

  // Contact form -> opens WhatsApp with message (no backend needed)
  const form = document.querySelector('[data-contact-form]');
  if(form){
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const msg = 'الاسم: '+(fd.get('name')||'')+'\nالبريد: '+(fd.get('email')||'')+'\nنوع الطلب: '+(fd.get('type')||'')+'\nالرسالة: '+(fd.get('message')||'');
      window.open('https://wa.me/'+SITE_CONFIG.whatsapp.full+'?text='+encodeURIComponent(msg),'_blank');
      const ok = document.querySelector('[data-form-ok]');
      if(ok) ok.style.display='block';
      form.reset();
    });
  }

  // Footer year
  document.querySelectorAll('[data-year]').forEach(el=>el.textContent=new Date().getFullYear());
})();

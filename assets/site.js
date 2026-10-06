
(function(){
  const head = document.getElementById('head');
  const onScroll = () => head.classList.toggle('is-solid', window.scrollY > 40);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  const clock = document.getElementById('clock');
  const fmt = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Dubai'});
  const tick = () => clock.textContent = fmt.format(new Date());
  tick(); setInterval(tick, 15000);

  const drawer = document.getElementById('drawer'), openB = document.getElementById('menuOpen');
  const setMenu = o => {
    drawer.classList.toggle('open', o); drawer.setAttribute('aria-hidden', !o); drawer.inert = !o;
    openB.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : '';
    (o ? document.getElementById('menuClose') : openB).focus({preventScroll:true});
  };
  openB.onclick = () => setMenu(true);
  document.getElementById('menuClose').onclick = () => setMenu(false);
  drawer.querySelectorAll('a').forEach(a => a.onclick = () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) setMenu(false); });

  document.querySelectorAll('a[href="#"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

  if (matchMedia('(hover: none)').matches){
    const io = new IntersectionObserver(en => en.forEach(x => x.target.classList.toggle('active', x.isIntersecting)), {threshold:.55});
    document.querySelectorAll('.svc-card').forEach(c => io.observe(c));
  }

  const live = document.getElementById('copied') || {};
  document.querySelectorAll('.copy-btn').forEach(b => b.onclick = async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch(e) { return; }
    b.textContent = 'Copied'; live.textContent = b.dataset.copy + ' copied';
    setTimeout(() => b.textContent = 'Copy', 2000);
  });

  const dock = document.getElementById('dock'), contact = document.getElementById('contact');
  let atContact = false;
  if (contact) new IntersectionObserver(en => { atContact = en[0].isIntersecting; setDock(); }).observe(contact);
  const setDock = () => dock.classList.toggle('show', window.scrollY > window.innerHeight * .8 && !atContact);
  window.addEventListener('scroll', setDock, {passive:true});

  document.querySelectorAll('.drawing').forEach(d => new IntersectionObserver((en, ob) => {
    if (en[0].isIntersecting){ d.classList.add('on'); ob.disconnect(); }
  }, {threshold:.3}).observe(d));

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const yacht = new Path2D('M30 136 L42 170 L850 170 C910 170 950 156 975 134 L988 112 C820 122 600 132 30 136 Z M168 135 L180 106 L700 104 C742 104 780 110 820 122 L168 136 Z M250 106 L262 84 L640 82 C680 82 712 89 742 104 Z M330 84 L342 64 L590 62 C616 62 640 70 662 82 Z M400 64 L410 51 L540 50 C556 50 566 55 574 62 Z M470 50 L477 33 L500 33 L507 50 Z M460 37 H518 V39 H460 Z');

  // night sea, light source off-frame; hero gets the distant yacht
  function makeSea(cv, opt){
    const ctx = cv.getContext('2d');
    let W, H, dpr, hz, lx, yx, ys, rows = [], lights = [], visible = true, raf = 0;

    function setup(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const narrow = W < 640;
      hz = H * (narrow ? opt.hzM : opt.hz);
      lx = W * (narrow ? opt.lxM : opt.lx);
      ys = Math.min(W * (narrow ? .34 : .17), 320) / 1000;
      yx = W * (narrow ? .06 : .14);
      rows = [];
      const n = Math.round((H - hz) * .9);
      for (let i = 0; i < n; i++){
        const p = Math.pow(i / n, 1.7);
        const y = hz + 2 + (H - hz) * p;
        const spread = 10 + p * W * .26;
        const count = 3 + Math.round(p * 7);
        for (let k = 0; k < count; k++){
          const g = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
          rows.push({y, p, x: lx + g * spread, len: 1.5 + p * 38 * Math.random(), ph: Math.random() * 6.28, sp: .5 + Math.random() * 1.5, d: Math.abs(g)});
        }
      }
      lights = [];
      if (opt.yacht) [[212,117,19,24],[288,95,13,26],[362,74,9,25],[330,145,15,28]].forEach(([x0,y,c,step]) => {
        for (let i = 0; i < c; i++) if (Math.random() > .3) lights.push({x: x0 + i * step, y, ph: Math.random()*6.28, hull: y > 140});
      });
    }

    function frame(t){
      raf = 0;
      t = t / 1000;
      const sky = ctx.createLinearGradient(0,0,0,hz);
      sky.addColorStop(0,'#05070A'); sky.addColorStop(.72,'#0B1116'); sky.addColorStop(1,'#18222A');
      ctx.fillStyle = sky; ctx.fillRect(0,0,W,hz);
      const glow = ctx.createRadialGradient(lx,-H*.12,0,lx,-H*.12,H*.75);
      glow.addColorStop(0,'rgba(214,208,194,.16)'); glow.addColorStop(1,'rgba(214,208,194,0)');
      ctx.fillStyle = glow; ctx.fillRect(0,0,W,hz);
      const sea = ctx.createLinearGradient(0,hz,0,H);
      sea.addColorStop(0,'#111920'); sea.addColorStop(.25,'#080C10'); sea.addColorStop(1,'#040608');
      ctx.fillStyle = sea; ctx.fillRect(0,hz,W,H-hz);
      const haze = ctx.createLinearGradient(0,hz-26,0,hz+18);
      haze.addColorStop(0,'rgba(120,132,140,0)'); haze.addColorStop(.55,'rgba(120,132,140,.11)'); haze.addColorStop(1,'rgba(120,132,140,0)');
      ctx.fillStyle = haze; ctx.fillRect(0,hz-26,W,44);

      for (const r of rows){
        const f = Math.pow(.5 + .5 * Math.sin(t * r.sp + r.ph + r.y * .05), 3);
        const a = f * (1 - Math.min(r.d, 1) * .8) * (.35 + r.p * .5);
        if (a < .02) continue;
        ctx.fillStyle = 'rgba(226,220,204,' + a.toFixed(3) + ')';
        ctx.fillRect(r.x + Math.sin(t * .4 + r.ph) * r.p * 6, r.y, r.len, Math.max(1, r.p * 1.6));
      }

      if (opt.yacht){
        const drift = still ? 0 : Math.sin(t * .25) * 1.1;
        ctx.save();
        ctx.translate(yx, hz - 170 * ys + 1 + drift);
        ctx.scale(ys, ys);
        ctx.fillStyle = '#030507'; ctx.fill(yacht);
        for (const l of lights){
          const a = (l.hull ? .55 : .8) + .2 * Math.sin(t * .7 + l.ph);
          ctx.fillStyle = 'rgba(236,196,138,' + a.toFixed(2) + ')';
          ctx.fillRect(l.x, l.y - 2, 11, l.hull ? 3 : 4);
        }
        ctx.restore();
        lights.forEach((l, i) => {
          if (i % 3) return;
          const x = yx + (l.x + 5) * ys, len = 6 + (170 - l.y) * ys * .9;
          const g = ctx.createLinearGradient(0,hz+2,0,hz+2+len);
          g.addColorStop(0,'rgba(236,196,138,.16)'); g.addColorStop(1,'rgba(236,196,138,0)');
          ctx.fillStyle = g; ctx.fillRect(x + Math.sin(t*1.3 + l.ph) * .8, hz + 2, 1.2, len);
        });
      }
      if (!still && visible) raf = requestAnimationFrame(frame);
    }

    setup(); raf = requestAnimationFrame(frame);
    new IntersectionObserver(en => {
      visible = en[0].isIntersecting;
      if (visible && !raf && !still) raf = requestAnimationFrame(frame);
    }).observe(cv);
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { setup(); if (!raf) raf = requestAnimationFrame(frame); }, 150); });
  }

    document.querySelectorAll('canvas.sea').forEach(cv => makeSea(cv, {hz:+(cv.dataset.hz || .18), hzM:+(cv.dataset.hzm || .14), lx:.76, lxM:.7, yacht:false}));
})();

// enquiry form: posts to FORM_ENDPOINT once configured, otherwise hands off to the mail app
(function(){
  const form = document.getElementById('enquiry');
  if (!form) return;
  const status = form.querySelector('.form-status');
  const topic = new URLSearchParams(location.search).get('topic');
  if (topic && form.interest.querySelector('option[value="' + topic + '"]')) form.interest.value = topic;

  const check = el => {
    const err = el.parentElement.querySelector('.err');
    let msg = '';
    if (el.required && !el.value.trim()) msg = 'Please fill in this field.';
    else if (el.type === 'email' && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value)) msg = 'Please enter a valid email address.';
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
    return !msg;
  };
  form.querySelectorAll('[required]').forEach(el => el.addEventListener('blur', () => check(el)));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (form.company.value) return;
    const bad = [...form.querySelectorAll('[required]')].filter(el => !check(el));
    if (bad.length){ bad[0].focus(); return; }
    const data = Object.fromEntries(new FormData(form));
    delete data.company;
    const label = form.interest.value ? form.interest.options[form.interest.selectedIndex].text : 'General enquiry';
    const endpoint = form.dataset.endpoint;
    const btn = form.querySelector('button[type="submit"]');
    if (endpoint){
      btn.disabled = true; btn.textContent = 'Sending…';
      try {
        const r = await fetch(endpoint, {method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'}, body: JSON.stringify(Object.assign({subject:'Enquiry: ' + label}, data))});
        if (!r.ok) throw 0;
        form.classList.add('sent');
        status.textContent = 'Thank you, ' + data.name.split(' ')[0] + '. Your enquiry has reached Kasper and he will reply personally.';
      } catch(_) {
        btn.disabled = false; btn.textContent = 'Send enquiry';
        status.textContent = 'Something went wrong. Please write to kasper@bjorn.ae directly.';
      }
      return;
    }
    const body = 'Name: ' + data.name + '\nEmail: ' + data.email + (data.phone ? '\nPhone: ' + data.phone : '') + '\nInterest: ' + label + '\n\n' + data.message;
    location.href = 'mailto:kasper@bjorn.ae?subject=' + encodeURIComponent('Enquiry: ' + label) + '&body=' + encodeURIComponent(body);
    status.textContent = 'Your email app has opened with the enquiry ready to send. If nothing happened, write to kasper@bjorn.ae.';
  });
})();

/* ═══════════════════════════════════════════════
   SKINDOX Mongolia — shared.js
   Common animations for all subpages.
   Vanilla JS only, no external libraries.
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── TOP BAR GLASS MORPHISM ON SCROLL ── */
  const topBar = document.querySelector('.top-bar');
  if (topBar) {
    window.addEventListener('scroll', () => {
      topBar.classList.toggle('tb-scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  /* ── AUTO-APPLY REVEAL CLASS ── */
  // Sections and major content blocks get scroll-reveal
  const revealSelectors = [
    'main > section',
    'main > div',
    '.sec-section',
    '.terms-grid',
    '.ranks-grid',
    '.member-grades',
    '.bonus-table-wrap',
    '.office-bonus',
    '.cta-section',
    '.steps-row',
    '.order-grid',
    '.cal-grid',
    '.legend',
    '.lesson-body > *',
    'main > h2',
    '.stamp',
  ];

  revealSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.classList.contains('reveal')) {
        el.classList.add('reveal');
        // Stagger siblings
        if (i % 4 === 1) el.classList.add('reveal-delay-1');
        if (i % 4 === 2) el.classList.add('reveal-delay-2');
        if (i % 4 === 3) el.classList.add('reveal-delay-3');
      }
    });
  });

  /* ── INTERSECTION OBSERVER FOR REVEAL ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.10, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── PRODUCT CARD 3D TILT ── */
  document.querySelectorAll('.product-card, .pcard').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `perspective(700px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-4px) scale(1.02)`;
      card.style.boxShadow = `${-x * 20}px ${Math.abs(y) * 6 + 14}px 40px rgba(55,159,175,${0.14 + Math.abs(x) * 0.14})`;
      card.style.animation = 'none';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
      card.style.animation = '';
    });
  });

  /* ── COUNT-UP ANIMATION ── */
  function animateCount(el) {
    const target  = parseFloat(el.dataset.count);
    const suffix  = el.dataset.suffix  || '';
    const prefix  = el.dataset.prefix  || '';
    const decimal = parseInt(el.dataset.decimal || '0');
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + (target * eased).toFixed(decimal) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('[data-count]').forEach(animateCount);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });

  // Observe any section containing data-count elements
  document.querySelectorAll('[data-count]').forEach(el => {
    const section = el.closest('section, main, .bonus-info-row, .member-grades') || el.parentElement;
    countObserver.observe(section);
  });

  /* ── SUBMIT BUTTON — Stop pulse on click, restore ── */
  document.querySelectorAll('.form-submit, button[type="submit"]').forEach(btn => {
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.97)');
    btn.addEventListener('mouseup',   () => btn.style.transform = '');
  });

  /* ── CALENDAR DAY CLICK RIPPLE ── */
  document.querySelectorAll('.cal-day:not(.empty)').forEach(day => {
    day.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.style.cssText = `
        position:absolute; border-radius:50%;
        background:rgba(55,159,175,0.25);
        width:60px; height:60px;
        top:${e.offsetY - 30}px; left:${e.offsetX - 30}px;
        transform:scale(0); animation:ripple 0.5s ease-out forwards;
        pointer-events:none; z-index:10;
      `;
      const style = document.createElement('style');
      style.textContent = '@keyframes ripple{to{transform:scale(4);opacity:0;}}';
      document.head.appendChild(style);
      day.style.position = 'relative';
      day.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  /* ── TABLE ROW REVEAL STAGGER ── */
  document.querySelectorAll('tbody tr').forEach((row, i) => {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-12px)';
    row.style.transition = `opacity 0.45s ease ${i * 0.06}s, transform 0.45s ease ${i * 0.06}s`;
  });

  const tableObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('tbody tr').forEach(row => {
          row.style.opacity = '1';
          row.style.transform = 'translateX(0)';
        });
        tableObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('table').forEach(t => tableObserver.observe(t));

  /* ── COPY TO CLIPBOARD FEEDBACK ── */
  document.querySelectorAll('[onclick*="copy"], .copy-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const orig = this.textContent;
      this.textContent = '✓ Хуулагдлаа';
      this.style.color = 'var(--teal)';
      setTimeout(() => {
        this.textContent = orig;
        this.style.color = '';
      }, 2000);
    });
  });

})();

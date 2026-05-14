/* ═══════════════════════════════════════════════════════
   SKINDOX Mongolia — motion.js
   4 premium effects: Split Text · Clip-path Reveal ·
   Blob Morphing · Magnetic Button + Grain Overlay
   Pure vanilla JS. No libraries.
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     UTIL: run after DOM is fully parsed
  ───────────────────────────────────────────────── */
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ════════════════════════════════════════════════
     1. SPLIT TEXT REVEAL
        Char-by-char stagger on hero titles,
        word-by-word on section titles.
  ════════════════════════════════════════════════ */

  function splitChars(el, stagger) {
    if (!el || el.dataset.motionSplit) return;
    el.dataset.motionSplit = '1';

    /* Preserve aria label */
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', el.textContent);
    }

    const nodes = [...el.childNodes];
    el.innerHTML = '';
    let idx = 0;

    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        /* split raw text chars */
        [...node.textContent].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'st-char';
          s.setAttribute('aria-hidden', 'true');
          s.style.transitionDelay = (idx * stagger) + 'ms';
          s.textContent = ch === ' ' ? ' ' : ch;
          el.appendChild(s);
          if (ch.trim()) idx++;
        });
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        /* preserve wrapper tag (e.g. <strong>) */
        const wrap = document.createElement(node.tagName);
        [...node.attributes].forEach(a => wrap.setAttribute(a.name, a.value));
        wrap.setAttribute('aria-hidden', 'true');
        [...node.textContent].forEach(ch => {
          const s = document.createElement('span');
          s.className = 'st-char';
          s.style.transitionDelay = (idx * stagger) + 'ms';
          s.textContent = ch === ' ' ? ' ' : ch;
          wrap.appendChild(s);
          if (ch.trim()) idx++;
        });
        el.appendChild(wrap);
      }
    });

    el.classList.add('st-ready');
  }

  function splitWords(el, stagger) {
    if (!el || el.dataset.motionSplit) return;
    el.dataset.motionSplit = '1';

    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', el.textContent);
    }

    /* Wrap each word (split on whitespace, preserve spaces) */
    el.innerHTML = el.textContent
      .split(/(\s+)/)
      .map((token, i) => {
        if (!token.trim()) return token; /* preserve whitespace */
        return `<span class="st-word" aria-hidden="true" style="transition-delay:${i * stagger}ms">${token}</span>`;
      })
      .join('');

    el.classList.add('st-word-ready');
  }

  ready(function () {

    /* Hero titles → char split */
    const charTargets = [
      { sel: '.hero-title',   stagger: 52 },
      { sel: '.lesson-title', stagger: 40 },
      { sel: '.vs-title',     stagger: 44 },
    ];
    charTargets.forEach(({ sel, stagger }) => {
      document.querySelectorAll(sel).forEach(el => splitChars(el, stagger));
    });

    /* Hero h1 on sub-pages */
    document.querySelectorAll('.hero h1:not(.hero-title)').forEach(el => splitChars(el, 44));

    /* Section titles → word split */
    document.querySelectorAll('.section-title, .sec-title').forEach(el => splitWords(el, 75));

    /* IntersectionObserver to fire animations */
    const textObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('st-visible');
          textObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('.st-ready, .st-word-ready').forEach(el => textObs.observe(el));
  });

  /* ════════════════════════════════════════════════
     2. CLIP-PATH SCROLL REVEAL
        Elements wipe upward into view.
        Applied automatically to images & cards.
  ════════════════════════════════════════════════ */

  ready(function () {

    /* Elements that get the "wipe-up" clip reveal */
    const clipUp = [
      '.product-img',
      '.hb-img-wrap',
      '.vs-player',
      '.map-placeholder img',
    ];

    /* Cards that get "wipe-up" with sibling stagger */
    const clipCards = [
      '.fcard',
      '.product-card',
      '.br-card',
      '.bi-card',
      '.lesson-card',
      '.notice-item',
      '.rank-card',
      '.term-card',
      '.mg-card',
      '.step-card',
      '.tip-card',
    ];

    clipUp.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!el.dataset.motionClip) {
          el.dataset.motionClip = '1';
          el.classList.add('clip-reveal');
        }
      });
    });

    clipCards.forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.dataset.motionClip) {
          el.dataset.motionClip = '1';
          el.classList.add('clip-reveal');
          /* Sibling stagger: cap at 0.44s */
          const sibIdx = [...(el.parentElement?.children || [])].indexOf(el);
          const delay = Math.min(sibIdx * 0.09, 0.44);
          if (delay > 0) el.style.transitionDelay = delay + 's';
        }
      });
    });

    /* Lesson / notice cards → slide from left */
    document.querySelectorAll('.lesson-card, .notice-item').forEach(el => {
      el.classList.remove('clip-reveal');
      el.classList.add('clip-reveal-left');
    });

    const clipObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('clip-visible');
          clipObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });

    document.querySelectorAll('.clip-reveal, .clip-reveal-left').forEach(el => clipObs.observe(el));
  });

  /* ════════════════════════════════════════════════
     3. BLOB MORPHING BACKGROUND
        Inject animated organic blobs into hero
        and dark sections. Pure CSS animation.
  ════════════════════════════════════════════════ */

  function makeBlob(cfg) {
    const el = document.createElement('div');
    el.className = 'blob-shape';
    el.setAttribute('aria-hidden', 'true');
    Object.entries(cfg).forEach(([k, v]) => (el.style[k] = v));
    return el;
  }

  function injectBlobs(selector, blobs) {
    const container = document.querySelector(selector);
    if (!container || container.dataset.motionBlobs) return;
    container.dataset.motionBlobs = '1';
    blobs.forEach(cfg => container.insertBefore(makeBlob(cfg), container.firstChild));
  }

  ready(function () {

    /* ── Hero right / brochure stage ── */
    injectBlobs('.hero-brochure-stage, .hero-right', [
      {
        width: '380px', height: '380px',
        background: 'radial-gradient(circle at 38% 38%, rgba(55,159,175,0.42), rgba(91,190,206,0.16) 52%, transparent 72%)',
        top: '-90px', right: '-90px',
        animationName: 'blobA', animationDuration: '9s', animationDelay: '0s',
      },
      {
        width: '260px', height: '260px',
        background: 'radial-gradient(circle at 62% 62%, rgba(201,168,76,0.24), rgba(253,246,239,0.10) 58%, transparent 78%)',
        bottom: '-55px', left: '-55px',
        animationName: 'blobB', animationDuration: '12s', animationDelay: '1.5s',
      },
      {
        width: '180px', height: '180px',
        background: 'radial-gradient(circle, rgba(249,150,120,0.14), transparent 70%)',
        top: '40%', left: '10%',
        animationName: 'blobD', animationDuration: '15s', animationDelay: '3s',
      },
    ]);

    /* ── Hero left — subtle atmosphere ── */
    injectBlobs('.hero-left', [
      {
        width: '520px', height: '520px',
        background: 'radial-gradient(circle, rgba(55,159,175,0.09) 0%, transparent 68%)',
        bottom: '-60px', left: '50%',
        transform: 'translateX(-50%)',
        animationName: 'blobC', animationDuration: '14s', animationDelay: '0.5s',
        zIndex: '1',
      },
    ]);

    /* ── Sub-page heroes ── */
    injectBlobs('.hero', [
      {
        width: '500px', height: '500px',
        background: 'radial-gradient(circle at 70% 40%, rgba(55,159,175,0.14) 0%, transparent 65%)',
        top: '-120px', right: '-80px',
        animationName: 'blobA', animationDuration: '10s', animationDelay: '0s',
        zIndex: '0',
      },
    ]);

    /* ── Bonus / dark sections ── */
    injectBlobs('.bonus-section', [
      {
        width: '420px', height: '420px',
        background: 'radial-gradient(circle at 35% 55%, rgba(201,168,76,0.10) 0%, transparent 65%)',
        top: '40px', right: '3%',
        animationName: 'blobD', animationDuration: '16s', animationDelay: '2s',
        zIndex: '0',
      },
      {
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(55,159,175,0.09) 0%, transparent 70%)',
        bottom: '40px', left: '5%',
        animationName: 'blobB', animationDuration: '11s', animationDelay: '4s',
        zIndex: '0',
      },
    ]);

    /* ── Video section ── */
    injectBlobs('.video-section', [
      {
        width: '340px', height: '340px',
        background: 'radial-gradient(circle at 50% 50%, rgba(55,159,175,0.12) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        animationName: 'blobC', animationDuration: '12s', animationDelay: '1s',
        zIndex: '0',
      },
    ]);

    /* ── Grain overlay on hero sections ── */
    document.querySelectorAll('.hero-left, .hero-brochure-stage, .lesson-hero, .bonus-section').forEach(el => {
      if (el.dataset.motionGrain) return;
      el.dataset.motionGrain = '1';
      const grain = document.createElement('div');
      grain.className = 'grain-overlay';
      grain.setAttribute('aria-hidden', 'true');
      el.appendChild(grain);
    });
  });

  /* ════════════════════════════════════════════════
     4. MAGNETIC BUTTON
        Cursor attraction + spring return + ripple.
        Touch devices are excluded automatically.
  ════════════════════════════════════════════════ */

  ready(function () {
    /* Only on devices with a real pointer (not touch) */
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const SEL = [
      '.btn-primary',
      '.btn-ghost',
      '.nav-phone',
      '.slide-arrow',
      '.hb-cta',
      '.form-submit',
      'button.slide-dot',
    ].join(', ');

    document.querySelectorAll(SEL).forEach(btn => {
      if (btn.dataset.motionMag) return;
      btn.dataset.motionMag = '1';
      btn.classList.add('magnetic');

      /* Cursor enters button zone — fast tracking */
      btn.addEventListener('mouseenter', () => {
        btn.style.transition =
          'transform 0.12s ease, box-shadow 0.15s ease, background 0.2s ease, color 0.2s ease';
      });

      /* Track cursor inside button */
      btn.addEventListener('mousemove', e => {
        const r   = btn.getBoundingClientRect();
        const cx  = r.left + r.width  / 2;
        const cy  = r.top  + r.height / 2;
        const dx  = (e.clientX - cx) * 0.30;
        const dy  = (e.clientY - cy) * 0.30;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      /* Spring back on leave */
      btn.addEventListener('mouseleave', () => {
        btn.style.transition =
          'transform 0.55s cubic-bezier(0.175,0.885,0.32,1.275), box-shadow 0.3s ease, background 0.2s ease, color 0.2s ease';
        btn.style.transform = 'translate(0,0)';
      });

      /* Click ripple */
      btn.addEventListener('click', e => {
        const r    = btn.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 2.2;
        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = `
          width:${size}px;
          height:${size}px;
          top:${e.clientY - r.top  - size / 2}px;
          left:${e.clientX - r.left - size / 2}px;
        `;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 580);
      });
    });
  });

  /* ════════════════════════════════════════════════
     BONUS: Smooth nav active link highlight
  ════════════════════════════════════════════════ */
  ready(function () {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href === path || (path === '' && href === 'index.html')) {
        a.style.cssText += ';color:var(--teal);background:var(--teal-light);border-radius:8px;';
      }
    });
  });

})();

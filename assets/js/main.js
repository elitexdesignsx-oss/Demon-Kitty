/**
 * Demon Kitty — Core JavaScript
 * Handles global interactions: age gate, themes, navigation, cookies,
 * gallery, carousel, and scroll animations.
 */
(function() {
  'use strict';

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------
  const getEl = (sel, ctx = document) => ctx.querySelector(sel);
  const getEls = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, type, handler) => el && el.addEventListener(type, handler);
  const getFocusable = (root) => getEls('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', root);

  // --------------------------------------------------------------------------
  // 1. AGE GATE
  // --------------------------------------------------------------------------
  const initAgeGate = () => {
    const gate = getEl('#age-gate');
    if (!gate) return;

    const TTL_DAYS = 30;
    const enterBtn = getEl('[data-age-enter]', gate);
    const exitBtn = getEl('[data-age-exit]', gate);
    const previousFocus = document.activeElement;

    const keepFocusInside = (event) => {
      if (event.key !== 'Tab') return;
      const focusable = getFocusable(gate);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const closeGate = () => {
      gate.hidden = true;
      gate.removeEventListener('keydown', keepFocusInside);
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };

    const isVerified = () => {
      try {
        const gateStatus = localStorage.getItem('vq_age_verified');
        if (gateStatus) {
          const parsed = JSON.parse(gateStatus);
          if (Date.now() < parsed.expiry) return true;
          localStorage.removeItem('vq_age_verified');
        }
      } catch (e) {}
      if (document.cookie.indexOf('vq_age_verified=1') !== -1) return true;
      return false;
    };

    if (isVerified()) {
      document.documentElement.classList.add('age-verified');
      gate.hidden = true;
      return;
    }

    gate.addEventListener('keydown', keepFocusInside);
    requestAnimationFrame(() => {
      if (enterBtn) enterBtn.focus();
    });

    on(enterBtn, 'click', () => {
      const expiry = Date.now() + (TTL_DAYS * 24 * 60 * 60 * 1000);
      try {
        localStorage.setItem('vq_age_verified', JSON.stringify({ verified: true, expiry }));
      } catch (e) {}
      document.cookie = `vq_age_verified=1; max-age=${TTL_DAYS * 86400}; path=/; SameSite=Lax`;
      document.documentElement.classList.add('age-verified');
      closeGate();
    });

    on(exitBtn, 'click', () => {
      window.location.href = 'https://www.google.com';
    });
  };

  // --------------------------------------------------------------------------
  // 2. DYNAMIC THEME ENGINE (Light Editorial vs Dark Chrome & Pink)
  // --------------------------------------------------------------------------
  const initThemeEngine = () => {
    let currentTheme = 'light';
    try {
      currentTheme = localStorage.getItem('dk_theme') || 'light';
    } catch (e) {}

    const updateButtons = (theme) => {
      const isDark = theme === 'dark';
      const moonSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      const sunSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

      getEls('[data-theme-toggle]').forEach(btn => {
        const icon = btn.querySelector('.theme-icon');
        const label = btn.querySelector('.theme-label');
        if (icon) icon.innerHTML = isDark ? sunSvg : moonSvg;
        if (label) label.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      });
    };

    const setTheme = (theme) => {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('dk_theme', theme);
      } catch (e) {}
      updateButtons(theme);
    };

    // Initialize with saved or default theme
    setTheme(currentTheme);

    // Global listener for all theme toggle buttons
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-toggle]');
      if (!btn) return;
      e.preventDefault();
      const active = document.documentElement.getAttribute('data-theme') || 'light';
      const next = active === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  };

  // --------------------------------------------------------------------------
  // 3. NAVIGATION DRAWER
  // --------------------------------------------------------------------------
  const initNavDrawer = () => {
    const drawer = getEl('#nav-drawer');
    const openBtn = getEl('[data-nav-open]');
    const closeBtn = getEl('[data-nav-close]');
    if (!drawer || !openBtn || !closeBtn) return;
    let previousFocus = null;

    const keepFocusInside = (event) => {
      if (event.key !== 'Tab' || !drawer.classList.contains('is-open')) return;
      const focusable = getFocusable(drawer);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const openDrawer = (e) => {
      if (e) e.preventDefault();
      if (!drawer || !openBtn) return;
      previousFocus = document.activeElement;
      drawer.classList.add('is-open');
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
      document.addEventListener('keydown', keepFocusInside);
      requestAnimationFrame(() => closeBtn.focus());
    };

    const closeDrawer = (e) => {
      if (e && e.target === drawer) {
        // Allow close if clicking the drawer background
      } else if (e && e.type === 'click' && closeBtn && closeBtn.contains(e.target)) {
        // Allow close if clicking the close button
      }
      
      if (!drawer || !openBtn) return;
      drawer.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', keepFocusInside);
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };

    on(openBtn, 'click', openDrawer);
    on(closeBtn, 'click', closeDrawer);
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer();
    });
    
    // Close on backdrop click
    on(drawer, 'click', (e) => {
      if (e.target === drawer) closeDrawer();
    });

    // Close on resize to desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 1024 && drawer.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  };

  // --------------------------------------------------------------------------
  // 4. COOKIE BANNER
  // --------------------------------------------------------------------------
  const initCookieBanner = () => {
    const banner = getEl('#cookie-banner');
    if (!banner) return;

    const STORAGE_KEY = 'vq_cookies';
    const saveBtn = getEl('[data-cookie-save]', banner);
    const necessaryBtn = getEl('[data-cookie-necessary]', banner);
    const cbAnalytics = getEl('[data-cookie-analytics]', banner);
    const cbMarketing = getEl('[data-cookie-marketing]', banner);

    if (localStorage.getItem(STORAGE_KEY)) {
      banner.hidden = true;
      return;
    }

    // Show after slight delay
    setTimeout(() => {
      banner.hidden = false;
      // Trigger animation frame for CSS transition
      requestAnimationFrame(() => {
        banner.classList.add('is-visible');
      });
    }, 1000);

    const savePreferences = (analytics, marketing) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        necessary: true,
        analytics,
        marketing,
        timestamp: Date.now()
      }));
      banner.classList.remove('is-visible');
      setTimeout(() => { banner.hidden = true; }, 500); // Wait for transition
    };

    on(saveBtn, 'click', () => savePreferences(cbAnalytics.checked, cbMarketing.checked));
    on(necessaryBtn, 'click', () => savePreferences(false, false));
  };

  // --------------------------------------------------------------------------
  // 5. REVIEWS CAROUSEL (Visibility Aware)
  // --------------------------------------------------------------------------
  const initCarousel = () => {
    const track = getEl('.review-track');
    const dots = getEls('.review-dots button, .review-dots span');
    if (!track || dots.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isAutoScrolling = !reduceMotion;
    let autoScrollInterval;
    let metrics = { cardWidth: 0, maxScroll: 0 };
    let updateRaf = null;

    const measureTrack = () => {
      metrics = {
        cardWidth: track.scrollWidth / dots.length,
        maxScroll: Math.max(0, track.scrollWidth - track.clientWidth),
      };
    };

    const updateDots = () => {
      if (!metrics.cardWidth) measureTrack();
      const scrollPos = track.scrollLeft;
      let activeIndex = Math.round(scrollPos / metrics.cardWidth);
      
      if (activeIndex >= dots.length) activeIndex = dots.length - 1;

      dots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === activeIndex);
        dot.setAttribute('aria-current', idx === activeIndex ? 'true' : 'false');
      });
    };

    const startAutoScroll = () => {
      if (reduceMotion) return;
      if (autoScrollInterval) clearInterval(autoScrollInterval);
      autoScrollInterval = setInterval(() => {
        if (!isAutoScrolling || document.hidden) return;
        
        if (track.scrollLeft >= metrics.maxScroll - 10) {
          track.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        } else {
          track.scrollBy({ left: metrics.cardWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      }, 5000);
    };

    // Pause on background tab to save CPU
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (autoScrollInterval) clearInterval(autoScrollInterval);
      } else {
        startAutoScroll();
      }
    });

    on(track, 'scroll', () => {
      if (updateRaf) return;
      updateRaf = requestAnimationFrame(() => {
        updateRaf = null;
        updateDots();
      });
    }, { passive: true });
    on(track, 'mouseenter', () => { isAutoScrolling = false; });
    on(track, 'mouseleave', () => { isAutoScrolling = true; });

    dots.forEach((dot, idx) => {
      on(dot, 'click', () => {
        isAutoScrolling = false;
        track.scrollTo({ left: metrics.cardWidth * idx, behavior: reduceMotion ? 'auto' : 'smooth' });
        setTimeout(() => { isAutoScrolling = true; }, 10000);
      });
    });

    measureTrack();
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        measureTrack();
        updateDots();
      });
      resizeObserver.observe(track);
    } else {
      window.addEventListener('resize', () => {
        measureTrack();
        updateDots();
      }, { passive: true });
    }
    startAutoScroll();
    updateDots();
  };

  // --------------------------------------------------------------------------
  // 6. GALLERY TABS & LIGHTBOX
  // --------------------------------------------------------------------------
  const initGallery = () => {
    const tabBtns = getEls('.gallery-tabs button');
    const items = getEls('.gallery-item');
    
    if (tabBtns.length > 0 && items.length > 0) {
      tabBtns.forEach(btn => {
        on(btn, 'click', () => {
          tabBtns.forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');
          
          const targetCat = btn.getAttribute('data-tab');
          
          items.forEach(item => {
            if (targetCat === 'all' || item.getAttribute('data-gallery-item') === targetCat) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        });
      });
    }

    const lightbox = getEl('.lightbox');
    const lightboxClose = getEl('.lightbox__close');
    
    if (lightbox && items.length > 0) {
      items.forEach(item => {
        on(item, 'click', () => {
          lightbox.classList.add('is-open');
        });
      });

      on(lightboxClose, 'click', () => lightbox.classList.remove('is-open'));
      on(lightbox, 'click', (e) => {
        if (e.target === lightbox) lightbox.classList.remove('is-open');
      });
    }

    const protectedEls = getEls('[data-protected]');
    protectedEls.forEach(el => {
      on(el, 'contextmenu', e => e.preventDefault());
      on(el, 'dragstart', e => e.preventDefault());
    });
  };

  // --------------------------------------------------------------------------
  // 7. LUXURY SCROLL ANIMATIONS (Staggered Intersection Observer + VRAM Cleanup)
  // --------------------------------------------------------------------------
  const initScrollAnimations = () => {
    const staggerContainers = getEls('.about-grid, .tribute-grid, .tribute-quotes-grid, .tribute-fetish-list, .gallery-grid, .gallery-tabs, .rules-list, .services-grid');
    staggerContainers.forEach(container => {
      const children = Array.from(container.children);
      children.forEach((child, idx) => {
        child.setAttribute('data-animate', '');
        child.setAttribute('data-delay', (idx % 6) + 1);
      });
    });

    const animatedElements = getEls('[data-animate]');
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Promote only during the actual reveal window, then release the layer
          // from the transition event instead of keeping one timer per element.
          const releaseLayer = (event) => {
            if (event.propertyName !== 'opacity' && event.propertyName !== 'transform' && event.propertyName !== 'filter') return;
            entry.target.style.willChange = 'auto';
            entry.target.removeEventListener('transitionend', releaseLayer);
            entry.target.removeEventListener('transitioncancel', releaseLayer);
          };
          entry.target.style.willChange = 'opacity, transform, filter';
          entry.target.addEventListener('transitionend', releaseLayer);
          entry.target.addEventListener('transitioncancel', releaseLayer);
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.02,
      rootMargin: '100px 0px 100px 0px'
    });

    animatedElements.forEach(el => observer.observe(el));
  };

  // --------------------------------------------------------------------------
  // 8. DYNAMIC MOUSE SPOTLIGHT (Direct Compositor Layer Engine)
  // --------------------------------------------------------------------------
  const initSpotlightAndGlow = () => {
    // Only run on desktop devices with precision pointers
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    let spotlight = getEl('.cursor-spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.className = 'cursor-spotlight';
      document.body.prepend(spotlight);
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 3;
    let currentX = mouseX;
    let currentY = mouseY;
    let isTicking = false;

    const updateSpotlight = () => {
      const dx = mouseX - currentX;
      const dy = mouseY - currentY;
      
      currentX += dx * 0.15;
      currentY += dy * 0.15;
      
      spotlight.style.transform = `translate3d(${currentX.toFixed(1)}px, ${currentY.toFixed(1)}px, 0)`;

      // Only continue loop if still interpolating towards cursor
      if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
        requestAnimationFrame(updateSpotlight);
      } else {
        isTicking = false;
      }
    };

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isTicking) {
        isTicking = true;
        requestAnimationFrame(updateSpotlight);
      }
    }, { passive: true });
  };

  // --------------------------------------------------------------------------
  // 9. 3D TACTILE CARD TILT (RAF-Throttled Performance)
  // --------------------------------------------------------------------------
  const initCardTiltInteractions = () => {
    const cards = getEls('.card, .tribute-card, .service-card, .rule-item, .metric');
    if (cards.length === 0 || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    cards.forEach(card => {
      let tiltRaf = null;

      on(card, 'mousemove', (e) => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
        tiltRaf = requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          const rotateX = ((y - centerY) / centerY) * -4.5;
          const rotateY = ((x - centerX) / centerX) * 4.5;

          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px) scale(1.012)`;
        });
      }, { passive: true });

      on(card, 'mouseleave', () => {
        if (tiltRaf) cancelAnimationFrame(tiltRaf);
        card.style.transform = '';
      });
    });
  };

  // --------------------------------------------------------------------------
  // 10. UNIVERSAL HERO BACKGROUND VIDEO RANDOMIZER & INFINITE LOOP ENGINE
  // --------------------------------------------------------------------------
  const initHeroVideoEngine = async () => {
    const containers = getEls('.hero-video-container');
    if (containers.length === 0) return;

    let videoPool = [];
    try {
      const manifestUrl = new URL('assets/video/manifest.json', document.baseURI);
      const response = await fetch(manifestUrl, { credentials: 'same-origin', cache: 'force-cache' });
      const manifest = await response.json();
      videoPool = Array.isArray(manifest?.videos)
        ? manifest.videos.filter(src => typeof src === 'string' && /\.mp4$/i.test(src))
        : [];
    } catch (error) {
      return;
    }
    if (videoPool.length < 2) return;

    function shuffle(array, lastPlayed) {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      if (lastPlayed && arr.length > 1 && arr[0] === lastPlayed) {
        const swapIdx = Math.floor(Math.random() * (arr.length - 1)) + 1;
        [arr[0], arr[swapIdx]] = [arr[swapIdx], arr[0]];
      }
      return arr;
    }

    containers.forEach(container => {
      let videos = Array.from(container.querySelectorAll('.hero-video-bg'));
      if (videos.length < 2) {
        const v2 = document.createElement('video');
        v2.className = 'hero-video-bg is-idle';
        v2.muted = true;
        v2.playsInline = true;
        v2.preload = 'auto';
        container.appendChild(v2);
        videos = Array.from(container.querySelectorAll('.hero-video-bg'));
      }

      let activeVideo = videos[0];
      let idleVideo = videos[1];

      activeVideo.classList.add('is-active');
      activeVideo.classList.remove('is-idle');
      idleVideo.classList.add('is-idle');
      idleVideo.classList.remove('is-active');

      activeVideo.muted = true;
      idleVideo.muted = true;

      let playlist = shuffle(videoPool);
      let currentIndex = 0;
      let isTransitioning = false;
      let fallbackTimer = null;
      let transitionTimer = null;
      let fallbackRemaining = null;
      let transitionRemaining = null;
      let fallbackDueAt = 0;
      let transitionDueAt = 0;
      let activeReady = false;

      const clearFallbackTimer = () => {
        if (fallbackTimer) clearTimeout(fallbackTimer);
        fallbackTimer = null;
      };

      const clearTransitionTimer = () => {
        if (transitionTimer) clearTimeout(transitionTimer);
        transitionTimer = null;
      };

      const scheduleFallback = (delay = 10000) => {
        clearFallbackTimer();
        fallbackRemaining = delay;
        if (document.hidden) return;
        fallbackDueAt = Date.now() + delay;
        fallbackTimer = setTimeout(() => {
          fallbackTimer = null;
          fallbackRemaining = null;
          transitionToNextClip();
        }, delay);
      };

      const scheduleTransitionCleanup = (delay, callback) => {
        clearTransitionTimer();
        transitionRemaining = delay;
        if (document.hidden) return;
        transitionDueAt = Date.now() + delay;
        transitionTimer = setTimeout(() => {
          transitionTimer = null;
          transitionRemaining = null;
          callback();
        }, delay);
      };

      const pauseTimers = () => {
        if (fallbackTimer) {
          fallbackRemaining = Math.max(0, fallbackDueAt - Date.now());
          clearFallbackTimer();
        }
        if (transitionTimer) {
          transitionRemaining = Math.max(0, transitionDueAt - Date.now());
          clearTransitionTimer();
        }
      };

      const resumeTimers = () => {
        if (fallbackRemaining !== null) scheduleFallback(fallbackRemaining);
        if (transitionRemaining !== null) {
          const remaining = transitionRemaining;
          scheduleTransitionCleanup(remaining, finishTransition);
        }
      };

      const preloadIdleVideo = () => {
        if (document.hidden || !activeReady || idleVideo.src) return;
        const nextIndex = (currentIndex + 1) % playlist.length;
        idleVideo.src = playlist[nextIndex];
        idleVideo.load();
      };

      // Start initial video immediately
      activeVideo.src = playlist[currentIndex];
      activeVideo.load();
      activeVideo.play().catch(() => {});

      const markActiveReady = () => {
        activeReady = true;
        preloadIdleVideo();
      };
      activeVideo.addEventListener('canplay', markActiveReady, { once: true });
      if (activeVideo.readyState >= 3) markActiveReady();

      function transitionToNextClip() {
        if (isTransitioning) return;
        isTransitioning = true;
        clearFallbackTimer();
        fallbackRemaining = null;

        currentIndex++;
        if (currentIndex >= playlist.length) {
          playlist = shuffle(videoPool, playlist[playlist.length - 1]);
          currentIndex = 0;
        }

        const targetSrc = playlist[currentIndex];
        if (idleVideo.src.indexOf(targetSrc) === -1) {
          idleVideo.src = targetSrc;
          idleVideo.load();
        }

        const performCrossfade = () => {
          idleVideo.removeEventListener('canplay', performCrossfade);
          idleVideo.play().then(() => {
            idleVideo.classList.remove('is-idle');
            idleVideo.classList.add('is-active');
            activeVideo.classList.remove('is-active');
            activeVideo.classList.add('is-idle');

            scheduleTransitionCleanup(850, finishTransition);
          }).catch(() => {
            isTransitioning = false;
            scheduleFallback(1000);
          });
        };

        function finishTransition() {
          activeVideo.pause();
          const temp = activeVideo;
          activeVideo = idleVideo;
          idleVideo = temp;
          isTransitioning = false;

          // Only populate the idle buffer after the new active clip is ready.
          activeReady = activeVideo.readyState >= 3;
          idleVideo.replaceChildren();
          idleVideo.removeAttribute('src');
          idleVideo.load();
          preloadIdleVideo();
          attachVideoListeners(activeVideo);
        }

        if (idleVideo.readyState >= 3) {
          performCrossfade();
        } else {
          idleVideo.addEventListener('canplay', performCrossfade, { once: true });
        }
      }

      function attachVideoListeners(video) {
        video.onended = transitionToNextClip;
        video.onerror = transitionToNextClip;
        let lastTimeCheck = 0;

        video.ontimeupdate = () => {
          const now = performance.now();
          if (now - lastTimeCheck < 250) return;
          lastTimeCheck = now;
          if (video.duration && video.duration - video.currentTime <= 0.45) {
            video.ontimeupdate = null;
            transitionToNextClip();
          }
        };

        scheduleFallback(10000);
      }

      attachVideoListeners(activeVideo);

      const handleVisibility = () => {
        const allHeroVideos = [activeVideo, idleVideo];
        if (document.hidden) {
          pauseTimers();
          allHeroVideos.forEach(video => video.pause());
          return;
        }

        activeVideo.play().catch(() => {});
        if (isTransitioning) idleVideo.play().catch(() => {});
        resumeTimers();
        preloadIdleVideo();
      };

      document.addEventListener('visibilitychange', handleVisibility);
    });
  };

  // --------------------------------------------------------------------------
  // 10B. GENERAL VIDEO VIEWPORT OPTIMIZER
  // --------------------------------------------------------------------------
  const initVideoViewportOptimizer = () => {
    const nonHeroVideos = getEls('video:not(.hero-video-bg)');
    if (nonHeroVideos.length === 0 || !('IntersectionObserver' in window)) return;

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (video.paused && video.hasAttribute('autoplay')) {
            video.play().catch(() => {});
          }
        } else {
          if (!video.paused) {
            video.pause();
          }
        }
      });
    }, { threshold: 0.1 });

    nonHeroVideos.forEach(v => videoObserver.observe(v));
  };

  // --------------------------------------------------------------------------
  // 11. STATS COUNTER ANIMATION
  // --------------------------------------------------------------------------
  const initStatsCounter = () => {
    const statNums = getEls('.metric .num');
    if (statNums.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach(num => observer.observe(num));

    function animateValue(obj) {
      const text = obj.textContent;
      const match = text.match(/([0-9.]+)([KM%]?)/);
      if (!match) return;
      
      const endVal = parseFloat(match[1]);
      const suffix = match[2];
      const isFloat = match[1].includes('.');
      
      const duration = 1500;
      const startTime = performance.now();
      
      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentVal = easeProgress * endVal;
        
        if (isFloat) {
          obj.textContent = currentVal.toFixed(1) + suffix;
        } else {
          obj.textContent = Math.floor(currentVal) + suffix;
        }
        
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          obj.textContent = text;
        }
      };
      
      requestAnimationFrame(update);
    }
  };

  // --------------------------------------------------------------------------
  // 12. GLOBAL LAZY LOADING (Images & Videos)
  // --------------------------------------------------------------------------
  const initLazyMedia = () => {
    getEls('img:not([loading])').forEach((img) => {
      if (!img.closest('#age-gate, .site-header, .nav-drawer')) img.loading = 'lazy';
      img.decoding = 'async';
    });
    if (!('IntersectionObserver' in window)) return;

    const lazyObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          if (el.tagName.toLowerCase() === 'img') {
            if (el.dataset.src && el.src !== el.dataset.src) {
              el.src = el.dataset.src;
            }
            el.classList.add('is-loaded');
          } else if (el.tagName.toLowerCase() === 'video') {
            if (el.dataset.src && !el.src) {
              el.src = el.dataset.src;
              el.load();
            }
            el.classList.add('is-loaded');
          }
          observer.unobserve(el);
        }
      });
    }, { rootMargin: '250px 0px 250px 0px' });

    getEls('img[data-src], video[data-src], .lazy-media').forEach(el => lazyObserver.observe(el));
  };

  // --------------------------------------------------------------------------
  // 13. FOOTER YEAR
  // --------------------------------------------------------------------------
  const initFooterYear = () => {
    const yearEls = getEls('[data-year]');
    const currentYear = new Date().getFullYear();
    yearEls.forEach(el => { el.textContent = currentYear; });
  };

  // --------------------------------------------------------------------------
  // INIT
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initAgeGate();
    initThemeEngine();
    initNavDrawer();
    initCookieBanner();
    initCarousel();
    initGallery();
    initScrollAnimations();
    initSpotlightAndGlow();
    initCardTiltInteractions();
    initHeroVideoEngine();
    initVideoViewportOptimizer();
    initStatsCounter();
    initLazyMedia();
    initFooterYear();
  });

})();

/* ========================================================================== 
   CONTENT PROTECTION
   ========================================================================== */
// Preserve the existing global protection behavior in one listener.
document.addEventListener('contextmenu', function(e) {
  e.preventDefault();
}, { passive: false });

// Kill dragging globally
document.addEventListener('dragstart', function(e) {
  e.preventDefault();
}, { passive: false });

// Kill touch-and-hold (long press) on mobile globally
document.addEventListener('touchstart', function(e) {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'VIDEO' || e.target.tagName === 'A') {
    // We don't preventDefault here normally as it kills scrolling, 
    // but webkit-touch-callout in CSS handles the iOS save menu.
  }
}, { passive: false });

// Extra protection for keyboard shortcuts (Save Page As)
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
  }
});

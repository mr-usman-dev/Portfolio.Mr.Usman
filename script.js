(function () {
  'use strict';
  const themeToggle = document.getElementById('themeToggle');
  const rootElement = document.documentElement;
  const bodyElement = document.body;
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const modalElements = document.querySelectorAll('.modal');
  let smoothScrollEngine = null;
  function syncSmoothScroll() {
    if (smoothScrollEngine && typeof smoothScrollEngine.resize === 'function') {
      smoothScrollEngine.resize();
    }
  }
  if (window.Lenis && !reducedMotionQuery.matches) {
    smoothScrollEngine = new window.Lenis({
      autoRaf: true,
      lerp: 0.12,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.02,
      syncTouch: true,
      syncTouchLerp: 0.12,
      prevent: (node) => !!node?.closest?.('[data-lenis-prevent]')
    });
    modalElements.forEach((modal) => {
      modal.addEventListener('show.bs.modal', () => {
        smoothScrollEngine.stop();
      });
      modal.addEventListener('hidden.bs.modal', () => {
        smoothScrollEngine.start();
        syncSmoothScroll();
      });
    });
    window.addEventListener('load', syncSmoothScroll, { once: true });
  }
  const preloaderElement = document.getElementById('sitePreloader');
  if (preloaderElement && bodyElement) {
    const prefersReducedMotion = reducedMotionQuery.matches;
    const minimumPreloadTime = prefersReducedMotion ? 1200 : 5200;
    const maximumPreloadTime = prefersReducedMotion ? 2600 : 7600;
    if (smoothScrollEngine) {
      smoothScrollEngine.stop();
    }
    const minDelayPromise = new Promise((resolve) => {
      setTimeout(resolve, minimumPreloadTime);
    });
    const loadPromise = new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve, { once: true });
      }
    });
    const maxDelayPromise = new Promise((resolve) => {
      setTimeout(resolve, maximumPreloadTime);
    });
    Promise.race([Promise.all([loadPromise, minDelayPromise]), maxDelayPromise]).then(() => {
      bodyElement.classList.add('preload-ready');
      setTimeout(() => {
        bodyElement.classList.remove('preload-active');
        bodyElement.classList.add('preload-complete');
        preloaderElement.setAttribute('aria-hidden', 'true');
        if (!window.location.hash || window.location.hash === '#home') {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'auto'
          });
        }
        if (smoothScrollEngine) {
          smoothScrollEngine.start();
          syncSmoothScroll();
        }
      }, 560);
    });
  } else if (bodyElement) {
    bodyElement.classList.remove('preload-active');
    syncSmoothScroll();
  }
  if (themeToggle) {
    const storedTheme = localStorage.getItem('portfolio-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = storedTheme || rootElement.getAttribute('data-theme') || (systemPrefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);
    themeToggle.addEventListener('click', () => {
      const currentTheme = rootElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      localStorage.setItem('portfolio-theme', nextTheme);
    });
  }
  function applyTheme(theme) {
    rootElement.setAttribute('data-theme', theme);
    if (!themeToggle) return;
    const darkModeActive = theme === 'dark';
    themeToggle.classList.toggle('is-dark', darkModeActive);
    themeToggle.setAttribute('aria-pressed', darkModeActive ? 'true' : 'false');
    themeToggle.setAttribute('aria-label', darkModeActive ? 'Switch to light mode' : 'Switch to dark mode');
  }
  const headerElement = document.querySelector('.site-header');
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollEffects() {
    const scrollTop = window.scrollY || window.pageYOffset;
    if (headerElement) {
      headerElement.classList.toggle('scrolled', scrollTop > 18);
    }
    if (scrollProgress) {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const progress = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;
      scrollProgress.style.width = `${Math.min(progress, 100)}%`;
    }
  }
  updateScrollEffects();
  window.addEventListener('scroll', updateScrollEffects, { passive: true });
  const navSectionLinks = document.querySelectorAll('.brand-inline-link[href^="#"], .nav-link[href^="#"]');
  const contentSections = document.querySelectorAll('main section[id]');
  const visibleSections = new Map();
  function setActiveNavLink(sectionId) {
    navSectionLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${sectionId}`;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
  if (contentSections.length && navSectionLinks.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.id;
          if (entry.isIntersecting) {
            visibleSections.set(sectionId, entry.intersectionRatio);
          } else {
            visibleSections.delete(sectionId);
          }
        });
        if (!visibleSections.size) return;
        const [mostVisibleSection] = [...visibleSections.entries()].sort((a, b) => b[1] - a[1])[0];
        setActiveNavLink(mostVisibleSection);
      },
      {
        threshold: [0.2, 0.45, 0.65],
        rootMargin: '-22% 0px -45% 0px'
      }
    );
    contentSections.forEach((section) => sectionObserver.observe(section));
  }
  const smoothLinks = document.querySelectorAll('.smooth-link, .nav-link[href^="#"]');
  smoothLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');
      if (!targetId || !targetId.startsWith('#')) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      const headerOffset = 76;
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      if (smoothScrollEngine && typeof smoothScrollEngine.scrollTo === 'function') {
        smoothScrollEngine.scrollTo(targetTop);
      } else {
        window.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        });
      }
      if (targetId.length > 1) {
        setActiveNavLink(targetId.slice(1));
      }
      const navCollapse = document.querySelector('.navbar-collapse.show');
      if (navCollapse) {
        bootstrap.Collapse.getOrCreateInstance(navCollapse).hide();
      }
    });
  });
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -40px 0px'
    }
  );
  revealElements.forEach((element) => revealObserver.observe(element));
  const serviceTriggers = document.querySelectorAll('.service-card-trigger');
  const serviceProcessModalElement = document.getElementById('serviceProcessModal');
  const serviceProcessModalLabel = document.getElementById('serviceProcessModalLabel');
  const serviceProcessSubtitle = document.getElementById('serviceProcessSubtitle');
  const serviceProcessList = document.getElementById('serviceProcessList');
  const serviceDeliverables = document.getElementById('serviceDeliverables');
  const serviceProcessSketch = document.getElementById('serviceProcessSketch');
  const serviceSketchCaption = document.getElementById('serviceSketchCaption');
  const serviceProcessTemplate = [
    { letter: 'A', text: 'Analyze brief for {{SERVICE}}.' },
    { letter: 'B', text: 'Build research direction.' },
    { letter: 'C', text: 'Create concepts around {{FOCUS}}.' },
    { letter: 'D', text: 'Define visual style rules.' },
    { letter: 'E', text: 'Establish hierarchy and balance.' },
    { letter: 'F', text: 'Form layouts and structure.' },
    { letter: 'G', text: 'Generate design variations.' },
    { letter: 'H', text: 'Highlight strongest direction.' },
    { letter: 'I', text: 'Iterate with feedback.' },
    { letter: 'J', text: 'Justify final creative decisions.' },
    { letter: 'K', text: 'Keep technical standards.' },
    { letter: 'L', text: 'Lock details and spacing.' },
    { letter: 'M', text: 'Map outputs by platform.' },
    { letter: 'N', text: 'Normalize file structure.' },
    { letter: 'O', text: 'Optimize export quality.' },
    { letter: 'P', text: 'Prepare real-context previews.' },
    { letter: 'Q', text: 'Quality-check every asset.' },
    { letter: 'R', text: 'Refine final version.' },
    { letter: 'S', text: 'Sync source and exports.' },
    { letter: 'T', text: 'Test web/print usage.' },
    { letter: 'U', text: 'Update after approval notes.' },
    { letter: 'V', text: 'Validate specs and formats.' },
    { letter: 'W', text: 'Wrap complete handoff pack.' },
    { letter: 'X', text: 'X-factor polish pass.' },
    { letter: 'Y', text: 'Yield final delivery.' },
    { letter: 'Z', text: 'Zip and archive project.' }
  ];
  const serviceProcessCatalog = {
    'logo-brand-identity': {
      title: 'Logo & Brand Identity',
      focus: 'logo systems, visual identity, and brand language',
      subtitle: 'Complete strategy-to-delivery roadmap for a professional logo and identity system.',
      deliverables: ['Primary + Secondary Logo', 'Brand Color System', 'Typography Pairing', 'Brand Guidelines PDF', 'Icon/Pattern Elements', 'AI, SVG, PNG, PDF Source Files']
    },
    'photoshop-retouching': {
      title: 'Photoshop Editing & Retouching',
      focus: 'retouching, compositing, and enhancement quality',
      subtitle: 'A production-ready process for high-end retouching and realistic photo enhancement.',
      deliverables: ['High-End Retouched Images', 'Before/After Samples', 'Color-Graded Exports', 'Web + Print Versions', 'Layered PSD Files', 'Revision Set']
    },
    'illustrator-vector-art': {
      title: 'Illustrator Vector Art',
      focus: 'clean vector construction and scalable artwork',
      subtitle: 'From sketch direction to scalable vector production with precision and clarity.',
      deliverables: ['Editable Vector Artwork', 'Icon/Illustration Set', 'Scalable SVG + AI Files', 'Outline + Color Variants', 'Usage Preview Boards', 'Final Export Pack']
    },
    'social-media-design': {
      title: 'Social Media Design',
      focus: 'campaign creative systems and content consistency',
      subtitle: 'End-to-end creative workflow for high-performing social content and ad-ready assets.',
      deliverables: ['Post + Story Templates', 'Campaign Visual Set', 'Reels Cover Variants', 'Ad Creatives', 'Canva/Figma/PSD Editable Files', 'Platform-wise Export Sizes']
    },
    'print-design': {
      title: 'Print Design (Flyers, Posters, Business Cards)',
      focus: 'print layout quality and production accuracy',
      subtitle: 'A complete print pipeline from concept and layout to press-ready final files.',
      deliverables: ['Flyer/Poster Layouts', 'Business Card Designs', 'CMYK Print Files', 'Bleed + Crop Ready PDFs', 'Typography + Grid Setup', 'Print Vendor Ready Package']
    },
    'web-ui-graphics': {
      title: 'Web & UI Graphics',
      focus: 'conversion-focused web graphics and UI visuals',
      subtitle: 'Structured process for digital graphics aligned with UX clarity and brand consistency.',
      deliverables: ['Hero Banners', 'Landing Section Graphics', 'UI Visual Assets', 'Web-Optimized Exports', 'Style-Matched Visual Kit', 'Editable Design Sources']
    },
    'packaging-label-design': {
      title: 'Packaging & Label Design',
      focus: 'shelf impact, product clarity, and packaging hierarchy',
      subtitle: 'From concept to dieline-ready design for premium and practical packaging outcomes.',
      deliverables: ['Front/Back Label Concepts', 'Packaging Mockups', 'Dieline Aligned Artwork', 'Print-Ready CMYK Files', 'Barcode/Info Placement', 'Master Editable Files']
    },
    'pitch-deck-presentation-design': {
      title: 'Pitch Deck & Presentation Design',
      focus: 'story-driven slide design and visual persuasion',
      subtitle: 'A complete deck design flow to improve clarity, authority, and investor confidence.',
      deliverables: ['Custom Slide Master', 'Investor Deck Layout', 'Data Visual Slides', 'Brand-consistent Icons', 'Presentation PDF + PPT', 'Editable Source Deck']
    },
    'motion-graphics-ads-reels': {
      title: 'Motion Graphics for Ads & Reels',
      focus: 'short-form animation and ad attention capture',
      subtitle: 'Concept-to-render motion process for social ads, reels, and high-engagement creatives.',
      deliverables: ['Animated Ad Variants', 'Reels Motion Templates', 'Intro/Outro Sequences', 'Optimized MP4 Exports', 'Project Files', 'Caption-safe Final Versions']
    },
    'brand-strategy-visual-direction': {
      title: 'Brand Strategy & Visual Direction',
      focus: 'positioning-led visual planning and creative governance',
      subtitle: 'A strategic roadmap connecting brand objectives with visual execution across channels.',
      deliverables: ['Brand Positioning Notes', 'Visual Direction Board', 'Tone + Style System', 'Creative Decision Framework', 'Channel Design Guidelines', 'Brand Direction Deck']
    },
    'infographic-data-visual-design': {
      title: 'Infographic & Data Visual Design',
      focus: 'clarity-first data storytelling and visual comprehension',
      subtitle: 'Data-to-design framework for making complex information clear and memorable.',
      deliverables: ['Infographic Concepts', 'Chart/Icon Visual Set', 'Narrative Data Layouts', 'Print + Web Variants', 'Source Editable Files', 'Presentation-ready Exports']
    }
  };
  function buildServiceSteps(serviceItem) {
    return serviceProcessTemplate.map((templateStep) => ({
      letter: templateStep.letter,
      text: templateStep.text
        .replace(/{{SERVICE}}/g, serviceItem.title)
        .replace(/{{FOCUS}}/g, serviceItem.focus)
    }));
  }
  function renderServiceProcess(serviceKey, fallbackTitle) {
    const activeService = serviceProcessCatalog[serviceKey] || {
      title: fallbackTitle || 'Creative Design Service',
      focus: 'creative execution quality and visual communication',
      subtitle: 'Complete project workflow from discovery to final delivery.',
      deliverables: ['Concept Files', 'Editable Sources', 'Web/Print Exports', 'Revision Round Assets'],
      sketch: 'service-process-sketches/generic-sketch.svg'
    };
    const processSteps = buildServiceSteps(activeService);
    const sketchPath = activeService.sketch || 'service-process-sketches/generic-sketch.svg';
    if (serviceProcessModalLabel) {
      serviceProcessModalLabel.textContent = `${activeService.title} - Complete Process`;
    }
    if (serviceProcessSubtitle) {
      serviceProcessSubtitle.textContent = activeService.subtitle;
    }
    if (serviceProcessList) {
      serviceProcessList.innerHTML = '';
      processSteps.forEach((stepItem) => {
        const listItem = document.createElement('li');
        const stepLabel = document.createElement('strong');
        stepLabel.textContent = `${stepItem.letter}. `;
        listItem.append(stepLabel, document.createTextNode(stepItem.text));
        serviceProcessList.appendChild(listItem);
      });
    }
    if (serviceDeliverables) {
      serviceDeliverables.innerHTML = '';
      activeService.deliverables.forEach((deliverable) => {
        const tag = document.createElement('span');
        tag.textContent = deliverable;
        serviceDeliverables.appendChild(tag);
      });
    }
    if (serviceProcessSketch) {
      serviceProcessSketch.src = sketchPath;
      serviceProcessSketch.alt = `Hand-drawn step-by-step process image for ${activeService.title}`;
      serviceProcessSketch.onerror = () => {
        serviceProcessSketch.src = 'service-process-sketches/generic-sketch.svg';
      };
    }
    if (serviceSketchCaption) {
      serviceSketchCaption.textContent = `${activeService.title} - Hand-drawn process sheet`;
    }
  }
  if (serviceTriggers.length && serviceProcessModalElement && window.bootstrap) {
    Object.keys(serviceProcessCatalog).forEach((serviceKey) => {
      serviceProcessCatalog[serviceKey].sketch = `service-process-sketches/${serviceKey}-sketch.svg`;
    });
    const serviceModal = new bootstrap.Modal(serviceProcessModalElement);
    serviceTriggers.forEach((trigger) => {
      const serviceCard = trigger.closest('.service-card') || trigger;
      const openServiceModal = () => {
        const serviceKey = trigger.dataset.serviceKey || serviceCard.dataset.serviceKey || '';
        const heading = serviceCard.querySelector('h3')?.textContent?.trim() || 'Design Service';
        renderServiceProcess(serviceKey, heading);
        serviceModal.show();
      };
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openServiceModal();
      });
    });
  }
  const certificateCards = Array.from(document.querySelectorAll('.certificate-preview-trigger'));
  const certificateModalElement = document.getElementById('certificateModal');
  const certificateModalImage = document.getElementById('certificateModalImage');
  const certificateModalTitle = document.getElementById('certificateModalTitle');
  const certificateModalIssuer = document.getElementById('certificateModalIssuer');
  const certificateModalYear = document.getElementById('certificateModalYear');
  const certificateModalId = document.getElementById('certificateModalId');
  const certificateStackScene = document.getElementById('certificateStackScene');
  const certificateStackPrev = document.getElementById('certificateStackPrev');
  const certificateStackNext = document.getElementById('certificateStackNext');
  if (certificateCards.length && certificateModalElement && certificateModalImage && window.bootstrap) {
    const certificateModal = new bootstrap.Modal(certificateModalElement);
    const certificateFallbackImage = 'certificates/certificate-adobe-visual-design.svg';
    const certificateOrder = certificateCards.map((_, index) => index);
    let activePointerId = null;
    let dragStartX = 0;
    let dragDeltaX = 0;
    let activeDragCard = null;
    let suppressCertificateClick = false;
    function openCertificatePreview(card) {
      const title = card.dataset.certTitle || 'Professional Certificate';
      const issuer = card.dataset.certIssuer || 'Verified Issuer';
      const year = card.dataset.certYear || '-';
      const credentialId = card.dataset.certId || '-';
      const imagePath = card.dataset.certImage || certificateFallbackImage;
      certificateModalImage.onerror = () => {
        certificateModalImage.onerror = null;
        certificateModalImage.src = certificateFallbackImage;
      };
      certificateModalImage.src = imagePath;
      certificateModalImage.alt = `${title} certificate preview`;
      if (certificateModalTitle) certificateModalTitle.textContent = title;
      if (certificateModalIssuer) certificateModalIssuer.textContent = issuer;
      if (certificateModalYear) certificateModalYear.textContent = year;
      if (certificateModalId) certificateModalId.textContent = credentialId;
      certificateModal.show();
    }
    function syncCertificateStack() {
      if (!certificateStackScene) return;
      certificateOrder.forEach((cardIndex, orderIndex) => {
        const card = certificateCards[cardIndex];
        let position = 'hidden';
        if (orderIndex === 0) position = 'front';
        if (orderIndex === 1) position = 'middle';
        if (orderIndex === 2) position = 'back';
        card.dataset.position = position;
        card.style.zIndex = String(certificateCards.length - orderIndex);
        card.style.removeProperty('--drag-offset');
        card.classList.remove('is-dragging');
        card.tabIndex = position === 'front' ? 0 : -1;
        card.setAttribute('aria-hidden', position === 'hidden' ? 'true' : 'false');
      });
    }
    function rotateCertificateStack(direction = 'next') {
      if (!certificateOrder.length) return;
      if (direction === 'prev') {
        certificateOrder.unshift(certificateOrder.pop());
      } else {
        certificateOrder.push(certificateOrder.shift());
      }
      syncCertificateStack();
    }
    function finishCertificateDrag(event) {
      if (!activeDragCard || event.pointerId !== activePointerId) return;
      const draggedEnoughToSuppressClick = Math.abs(dragDeltaX) > 8;
      if (activeDragCard.hasPointerCapture(event.pointerId)) {
        activeDragCard.releasePointerCapture(event.pointerId);
      }
      activeDragCard.classList.remove('is-dragging');
      activeDragCard.style.removeProperty('--drag-offset');
      if (dragDeltaX <= -120) rotateCertificateStack('next');
      if (dragDeltaX >= 120) rotateCertificateStack('prev');
      activePointerId = null;
      dragStartX = 0;
      dragDeltaX = 0;
      activeDragCard = null;
      suppressCertificateClick = draggedEnoughToSuppressClick;
      window.setTimeout(() => {
        suppressCertificateClick = false;
      }, 90);
    }
    if (certificateStackScene) {
      syncCertificateStack();
      certificateStackScene.addEventListener('pointerdown', (event) => {
        const frontCard = event.target.closest('.certificate-preview-trigger[data-position="front"]');
        if (!frontCard) return;
        activePointerId = event.pointerId;
        dragStartX = event.clientX;
        dragDeltaX = 0;
        activeDragCard = frontCard;
        suppressCertificateClick = false;
        frontCard.classList.add('is-dragging');
        frontCard.setPointerCapture(event.pointerId);
      });
      certificateStackScene.addEventListener('pointermove', (event) => {
        if (!activeDragCard || event.pointerId !== activePointerId) return;
        dragDeltaX = event.clientX - dragStartX;
        activeDragCard.style.setProperty('--drag-offset', `${dragDeltaX}px`);
      });
      certificateStackScene.addEventListener('pointerup', finishCertificateDrag);
      certificateStackScene.addEventListener('pointercancel', finishCertificateDrag);
      certificateStackScene.addEventListener('pointerleave', (event) => {
        if (activeDragCard && event.pointerId === activePointerId) {
          finishCertificateDrag(event);
        }
      });
    }
    if (certificateStackPrev) {
      certificateStackPrev.addEventListener('click', () => rotateCertificateStack('prev'));
    }
    if (certificateStackNext) {
      certificateStackNext.addEventListener('click', () => rotateCertificateStack('next'));
    }
    certificateCards.forEach((card) => {
      card.addEventListener('click', (event) => {
        if (suppressCertificateClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        if (certificateStackScene && card.dataset.position !== 'front') {
          event.preventDefault();
          return;
        }
        openCertificatePreview(card);
      });
      card.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          rotateCertificateStack('prev');
          return;
        }
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          rotateCertificateStack('next');
          return;
        }
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (certificateStackScene && card.dataset.position !== 'front') return;
          openCertificatePreview(card);
        }
      });
    });
    certificateModalElement.addEventListener('hidden.bs.modal', () => {
      certificateModalImage.src = '';
      certificateModalImage.alt = 'Certificate preview';
    });
  }
  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioGrid = document.getElementById('portfolioGrid');
  const portfolioItems = Array.from(document.querySelectorAll('.portfolio-item'));
  const portfolioSort = document.getElementById('portfolioSort');
  const portfolioResults = document.getElementById('portfolioResults');
  const portfolioEmpty = document.getElementById('portfolioEmpty');
  let activePortfolioFilter = 'all';
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activePortfolioFilter = button.dataset.filter || 'all';
      filterButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      applyPortfolioState();
    });
  });
  if (portfolioSort) {
    portfolioSort.addEventListener('change', applyPortfolioState);
  }
  function getPortfolioTitle(item) {
    const card = item.querySelector('.portfolio-card');
    return card?.dataset.title || item.querySelector('.portfolio-overlay h3')?.textContent || '';
  }
  function sortPortfolioItems(items, mode) {
    const sortedItems = [...items];
    if (mode === 'oldest') {
      sortedItems.sort((a, b) => Number(a.dataset.year || 0) - Number(b.dataset.year || 0));
      return sortedItems;
    }
    if (mode === 'az') {
      sortedItems.sort((a, b) => getPortfolioTitle(a).localeCompare(getPortfolioTitle(b)));
      return sortedItems;
    }
    sortedItems.sort((a, b) => Number(b.dataset.year || 0) - Number(a.dataset.year || 0));
    return sortedItems;
  }
  function hidePortfolioItem(item) {
    item.classList.add('is-hidden');
    setTimeout(() => {
      if (item.classList.contains('is-hidden')) {
        item.classList.add('d-none');
      }
    }, 280);
  }
  function showPortfolioItem(item) {
    if (item.classList.contains('d-none')) {
      item.classList.remove('d-none');
    }
    requestAnimationFrame(() => item.classList.remove('is-hidden'));
  }
  function applyPortfolioState() {
    if (!portfolioItems.length || !portfolioGrid) return;
    const sortMode = portfolioSort?.value || 'newest';
    const matchedItems = portfolioItems.filter((item) => {
      const categories = (item.dataset.category || '').split(/\s+/).filter(Boolean);
      return activePortfolioFilter === 'all' || categories.includes(activePortfolioFilter);
    });
    const orderedVisible = sortPortfolioItems(matchedItems, sortMode);
    const visibleSet = new Set(orderedVisible);
    orderedVisible.forEach((item) => portfolioGrid.appendChild(item));
    portfolioItems.forEach((item) => {
      if (!visibleSet.has(item)) {
        portfolioGrid.appendChild(item);
      }
    });
    portfolioItems.forEach((item) => {
      if (visibleSet.has(item)) {
        showPortfolioItem(item);
      } else {
        hidePortfolioItem(item);
      }
    });
    if (portfolioResults) {
      const count = matchedItems.length;
      portfolioResults.textContent = `${count} Project${count === 1 ? '' : 's'} Found`;
    }
    if (portfolioEmpty) {
      portfolioEmpty.classList.toggle('d-none', matchedItems.length > 0);
    }
  }
  applyPortfolioState();
  const portfolioGalleryAssets = {
    brandStationery: 'https://images.unsplash.com/photo-1636633762833-5d1658f1e29b?auto=format&fit=crop&w=1400&q=80',
    strategyDesk: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1400&auto=format&fit=crop',
    socialGrid: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?auto=format&fit=crop&w=1400&q=80',
    printCollateral: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?auto=format&fit=crop&w=1400&q=80',
    portraitRetouch: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=1400&q=80',
    restaurantBrand: 'https://images.unsplash.com/photo-1452802447250-470a88ac82bc?auto=format&fit=crop&w=1400&q=80',
    startupLaunch: 'https://images.unsplash.com/photo-1456324463128-7ff6903988d8?auto=format&fit=crop&w=1400&q=80',
    productAds: 'https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=1400&q=80'
  };
  const portfolioProjectGalleries = {
    'atelier-noir-identity': [
      { image: portfolioGalleryAssets.brandStationery, title: 'Monogram concept boards', description: 'Started with a sharp monogram direction to give Atelier Noir a premium, memorable logo foundation.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Launch reveal mockups', description: 'Converted the identity into digital reveal visuals so the first impression felt premium on screens as well.' },
      { image: portfolioGalleryAssets.printCollateral, title: 'Packaging direction', description: 'Built packaging-facing boards with typography, contrast, and finishing cues for a luxury retail feel.' },
      { image: portfolioGalleryAssets.startupLaunch, title: 'Presentation system', description: 'Prepared client-facing presentation layouts that made logo decisions and visual hierarchy easy to approve.' },
      { image: portfolioGalleryAssets.restaurantBrand, title: 'Brand applications', description: 'Final mockups showed how the identity behaves across signage, menu-style layouts, and branded surfaces.' }
    ],
    'northline-brand-manual': [
      { image: portfolioGalleryAssets.startupLaunch, title: 'Brand structure outline', description: 'Outlined the manual around practical usage, tone consistency, and executive-facing brand clarity.' },
      { image: portfolioGalleryAssets.brandStationery, title: 'Stationery master set', description: 'Designed letterheads, cards, and formal stationery templates that keep the company image clean and consistent.' },
      { image: portfolioGalleryAssets.printCollateral, title: 'Print-ready standards', description: 'Defined print-safe layout rules, clear spacing, and export standards for vendors and internal teams.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Investor deck styling', description: 'Extended the brand system into presentation templates for proposals, reports, and investor communication.' },
      { image: portfolioGalleryAssets.socialGrid, title: 'Cross-channel consistency', description: 'Closed the project with reference layouts that keep the same visual language across online and offline use.' }
    ],
    'veloura-social-launch': [
      { image: portfolioGalleryAssets.socialGrid, title: 'Feed campaign hero set', description: 'Designed the primary post system with strong hierarchy, sale hooks, and a fashion-led visual rhythm.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Mobile-first rollout', description: 'Mapped creative variations for phone-first viewing so the campaign stayed clean in crowded social feeds.' },
      { image: portfolioGalleryAssets.portraitRetouch, title: 'Model and product retouch', description: 'Refined source imagery to keep skin, fabric, and lighting polished before building final post variations.' },
      { image: portfolioGalleryAssets.startupLaunch, title: 'Story and reel covers', description: 'Built supporting story and reel cover assets to keep every launch touchpoint visually connected.' },
      { image: portfolioGalleryAssets.printCollateral, title: 'Ad variation pack', description: 'Finished with reusable ad formats for promo drops, countdown posts, and remarketing creatives.' }
    ],
    'summit-expo-print': [
      { image: portfolioGalleryAssets.printCollateral, title: 'Event print overview', description: 'Established a headline-driven visual system for expo posters, handouts, and directional print pieces.' },
      { image: portfolioGalleryAssets.brandStationery, title: 'Brand alignment pass', description: 'Matched every print asset with the event identity so banners, flyers, and brochures felt like one system.' },
      { image: portfolioGalleryAssets.startupLaunch, title: 'Information hierarchy', description: 'Structured content-heavy pages for quick scanning by attendees, sponsors, and booth visitors.' },
      { image: portfolioGalleryAssets.socialGrid, title: 'Promotion support assets', description: 'Added supporting announcement and promotional visuals so the event stayed consistent before launch day.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Vendor-ready delivery', description: 'Delivered final CMYK files with bleed, crop safety, and organized output packs for fast print production.' }
    ],
    'lumiere-retouch-series': [
      { image: portfolioGalleryAssets.portraitRetouch, title: 'Raw portrait cleanup', description: 'Removed distractions, balanced exposure, and prepared the base files for high-end retouching work.' },
      { image: portfolioGalleryAssets.socialGrid, title: 'Campaign crop variations', description: 'Adapted the beauty imagery into multiple crops without losing facial balance or premium composition.' },
      { image: portfolioGalleryAssets.brandStationery, title: 'Tone and color control', description: 'Refined skin tones, highlights, and contrast to keep the final images polished but still realistic.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Detail refinement pass', description: 'Handled texture preservation, edge cleanup, and selective sharpening for a commercial finish.' },
      { image: portfolioGalleryAssets.portraitRetouch, title: 'Final approved frames', description: 'Delivered the selected hero portraits with consistent grading for campaign use across print and digital.' }
    ],
    'saffron-table-rebrand': [
      { image: portfolioGalleryAssets.restaurantBrand, title: 'Rebrand concept route', description: 'Repositioned the restaurant with warmer typography, a cleaner mark, and a richer hospitality feel.' },
      { image: portfolioGalleryAssets.brandStationery, title: 'Logo and menu styling', description: 'Connected the new logo language with menu layouts so the restaurant felt premium in every ordering touchpoint.' },
      { image: portfolioGalleryAssets.printCollateral, title: 'Packaging accents', description: 'Extended the identity into takeaway and promo packaging with a more polished shelf and counter presence.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Campaign mockups', description: 'Prepared rollout visuals that helped the client preview the rebrand before interior and print production.' },
      { image: portfolioGalleryAssets.socialGrid, title: 'Digital support visuals', description: 'Finished with social-ready brand assets so the refreshed identity stayed consistent online as well.' }
    ],
    'pilot-edge-launch-kit': [
      { image: portfolioGalleryAssets.strategyDesk, title: 'Launch visual direction', description: 'Set the core launch direction around a sharper tech tone, cleaner spacing, and confident visual storytelling.' },
      { image: portfolioGalleryAssets.startupLaunch, title: 'Presentation deck system', description: 'Built founder-ready slides that made the startup look organized, credible, and investor-ready.' },
      { image: portfolioGalleryAssets.socialGrid, title: 'Social reveal assets', description: 'Added social launch cards and announcement creatives so the first campaign rollout stayed consistent.' },
      { image: portfolioGalleryAssets.brandStationery, title: 'Brand support elements', description: 'Created supporting brand textures, layout rules, and simple reusable design blocks for future content.' },
      { image: portfolioGalleryAssets.printCollateral, title: 'Final launch toolkit', description: 'Delivered a clean starter pack that the team could reuse across pitch, social, and early marketing assets.' }
    ],
    'primecart-product-refresh': [
      { image: portfolioGalleryAssets.productAds, title: 'Product image cleanup', description: 'Corrected lighting, edges, and shadows so every product looked sharper and more trustworthy for buyers.' },
      { image: portfolioGalleryAssets.socialGrid, title: 'Ad crop system', description: 'Prepared platform-specific crops for paid ads and promotional posts without losing product focus.' },
      { image: portfolioGalleryAssets.printCollateral, title: 'Marketplace format set', description: 'Built consistent export variations for listings, feature graphics, and promotional tiles.' },
      { image: portfolioGalleryAssets.strategyDesk, title: 'Conversion-focused polish', description: 'Refined contrast, callout space, and composition so the visuals supported cleaner, higher-converting layouts.' },
      { image: portfolioGalleryAssets.brandStationery, title: 'Final delivery pack', description: 'Delivered organized source and export files ready for marketplace updates, ads, and seasonal campaigns.' }
    ]
  };
  const portfolioCards = document.querySelectorAll('.portfolio-card');
  const portfolioModalElement = document.getElementById('portfolioModal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('portfolioModalLabel');
  const modalCategory = document.getElementById('modalCategory');
  const modalDescription = document.getElementById('modalDescription');
  const modalClient = document.getElementById('modalClient');
  const modalTools = document.getElementById('modalTools');
  const modalTimeline = document.getElementById('modalTimeline');
  const modalSlideTitle = document.getElementById('modalSlideTitle');
  const modalSlideCounter = document.getElementById('modalSlideCounter');
  const modalSlideMeta = document.getElementById('modalSlideMeta');
  const modalDots = document.getElementById('portfolioModalDots');
  const modalPrevSlide = document.getElementById('portfolioPrevSlide');
  const modalNextSlide = document.getElementById('portfolioNextSlide');
  const portfolioModalStage = document.getElementById('portfolioModalStage');
  const portfolioModalInfo = document.getElementById('portfolioModalInfo');
  const portfolioSlideClientStages = ['Discovery Session', 'Concept Review', 'Application Build', 'Revision Approval', 'Final Handoff'];
  const portfolioSlideToolFocus = ['Research boards', 'Mockup system', 'Production layout', 'Polish pass', 'Export package'];
  const portfolioSlidePhases = ['Concept Phase', 'Development Phase', 'Application Phase', 'Refinement Phase', 'Delivery Phase'];
  if (portfolioModalElement && modalImage && modalTitle) {
    const portfolioModal = new bootstrap.Modal(portfolioModalElement);
    const portfolioModalState = {
      projectTitle: '',
      projectMeta: {
        category: 'Creative Project',
        client: '-',
        tools: '-',
        timeline: '-'
      },
      slides: [],
      index: 0
    };
    let portfolioAnimationTimer = 0;
    function buildFallbackGallery(card) {
      return [{
        image: card.dataset.image || '',
        title: card.dataset.title || 'Project Preview',
        description: card.dataset.description || 'Project details will be shared here.'
      }];
    }
    function clearPortfolioAnimationState() {
      if (portfolioModalStage) portfolioModalStage.classList.remove('is-animating');
      if (portfolioModalInfo) portfolioModalInfo.classList.remove('is-animating');
      window.clearTimeout(portfolioAnimationTimer);
    }
    function queuePortfolioAnimation() {
      clearPortfolioAnimationState();
      if (portfolioModalStage) {
        void portfolioModalStage.offsetWidth;
        portfolioModalStage.classList.add('is-animating');
      }
      if (portfolioModalInfo) {
        void portfolioModalInfo.offsetWidth;
        portfolioModalInfo.classList.add('is-animating');
      }
      portfolioAnimationTimer = window.setTimeout(() => {
        clearPortfolioAnimationState();
      }, 220);
    }
    function syncPortfolioDots() {
      if (!modalDots) return;
      Array.from(modalDots.children).forEach((dot, index) => {
        const isActive = index === portfolioModalState.index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
    }
    function buildPortfolioDots() {
      if (!modalDots) return;
      modalDots.innerHTML = '';
      portfolioModalState.slides.forEach((slide, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'portfolio-modal-dot';
        dot.setAttribute('aria-label', `Show image ${index + 1} for ${portfolioModalState.projectTitle}`);
        dot.addEventListener('click', () => {
          if (index === portfolioModalState.index) return;
          portfolioModalState.index = index;
          renderPortfolioSlide({ animate: true });
        });
        modalDots.appendChild(dot);
      });
      syncPortfolioDots();
    }
    function renderPortfolioSlide(options = {}) {
      const { animate = true } = options;
      const slide = portfolioModalState.slides[portfolioModalState.index];
      if (!slide) return;
      const totalSlides = portfolioModalState.slides.length;
      const slideIndex = portfolioModalState.index;
      const baseMeta = portfolioModalState.projectMeta;
      const stageLabel = portfolioSlidePhases[slideIndex] || `Slide ${slideIndex + 1}`;
      const clientStage = portfolioSlideClientStages[slideIndex] || `Stage ${slideIndex + 1}`;
      const toolFocus = portfolioSlideToolFocus[slideIndex] || 'Execution';
      if (animate) {
        queuePortfolioAnimation();
      } else {
        clearPortfolioAnimationState();
      }
      modalImage.src = slide.image;
      modalImage.alt = `${portfolioModalState.projectTitle} - ${slide.title}`;
      if (modalCategory) modalCategory.textContent = slide.category || `${baseMeta.category} / ${stageLabel}`;
      if (modalSlideTitle) modalSlideTitle.textContent = slide.title;
      if (modalDescription) modalDescription.textContent = slide.description;
      if (modalClient) modalClient.textContent = slide.client || `${baseMeta.client} / ${clientStage}`;
      if (modalTools) modalTools.textContent = slide.tools || `${baseMeta.tools} / ${toolFocus}`;
      if (modalTimeline) modalTimeline.textContent = slide.timeline || `${stageLabel} / ${baseMeta.timeline}`;
      if (modalSlideCounter) modalSlideCounter.textContent = `${slideIndex + 1} / ${totalSlides}`;
      if (modalSlideMeta) modalSlideMeta.textContent = slide.gallery || `${slideIndex + 1} / ${totalSlides} - ${slide.title}`;
      syncPortfolioDots();
    }
    function stepPortfolioSlide(direction) {
      if (portfolioModalState.slides.length < 2) return;
      portfolioModalState.index = (portfolioModalState.index + direction + portfolioModalState.slides.length) % portfolioModalState.slides.length;
      renderPortfolioSlide({ animate: true });
    }
    portfolioCards.forEach((card) => {
      card.addEventListener('click', () => {
        const projectKey = card.dataset.project || '';
        const gallery = portfolioProjectGalleries[projectKey] || buildFallbackGallery(card);
        const title = card.dataset.title || 'Project Preview';
        const categoryLabel = card.dataset.categoryLabel || 'Creative Project';
        const client = card.dataset.client || '-';
        const tools = card.dataset.tools || '-';
        const timeline = card.dataset.delivery || '-';
        portfolioModalState.projectTitle = title;
        portfolioModalState.projectMeta = {
          category: categoryLabel,
          client,
          tools,
          timeline
        };
        portfolioModalState.slides = gallery;
        portfolioModalState.index = 0;
        modalTitle.textContent = title;
        buildPortfolioDots();
        renderPortfolioSlide({ animate: false });
        portfolioModal.show();
      });
    });
    if (modalPrevSlide) {
      modalPrevSlide.addEventListener('click', (event) => {
        event.stopPropagation();
        stepPortfolioSlide(-1);
      });
    }
    if (modalNextSlide) {
      modalNextSlide.addEventListener('click', (event) => {
        event.stopPropagation();
        stepPortfolioSlide(1);
      });
    }
    document.addEventListener('keydown', (event) => {
      if (!portfolioModalElement.classList.contains('show')) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepPortfolioSlide(-1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepPortfolioSlide(1);
      }
    });
    portfolioModalElement.addEventListener('hidden.bs.modal', () => {
      clearPortfolioAnimationState();
      portfolioModalState.projectTitle = '';
      portfolioModalState.projectMeta = {
        category: 'Creative Project',
        client: '-',
        tools: '-',
        timeline: '-'
      };
      portfolioModalState.slides = [];
      portfolioModalState.index = 0;
      modalImage.src = '';
      modalImage.alt = 'Portfolio project preview';
      if (modalCategory) modalCategory.textContent = 'Category';
      if (modalSlideTitle) modalSlideTitle.textContent = 'Slide title';
      if (modalDescription) modalDescription.textContent = 'Detailed slide information will appear here.';
      if (modalClient) modalClient.textContent = '-';
      if (modalTools) modalTools.textContent = '-';
      if (modalTimeline) modalTimeline.textContent = '-';
      if (modalSlideCounter) modalSlideCounter.textContent = '1 / 5';
      if (modalSlideMeta) modalSlideMeta.textContent = '5 Visuals';
      if (modalDots) modalDots.innerHTML = '';
    });
  }
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
})();

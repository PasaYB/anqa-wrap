gsap.registerPlugin(ScrollTrigger);

const isDesktop = () => window.innerWidth > 1024;

// Initial states
gsap.set(['.intro-title', '.intro-tagline', '.intro-hint'], { opacity: 0, y: 20 });

// Animation
const introTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
introTl
  .to(['.intro-title', '.intro-tagline', '.intro-hint'], {
    opacity: 1,
    y: 0,
    duration: 1.0,
    stagger: 0.25
  })
  .to('#intro', {
    opacity: 0,
    duration: 1.1,
    delay: 1.4,
    ease: 'power2.inOut',
    onComplete: () => {
      const el = document.getElementById('intro');
      el.style.pointerEvents = 'none';
      el.style.display = 'none';
    }
  });

/* ── Timeline Line Reveal (conditional axis) ──────────── */

/* ── Horizontal Scroll (Desktop only) ────────────────── */
let hScrollTween = null;

function initHorizontalScroll() {
  if (!isDesktop()) return;

  const track = document.getElementById('track');

  hScrollTween = gsap.to(track, {
    x: () => -(track.scrollWidth - window.innerWidth),
    ease: 'none',
    scrollTrigger: {
      trigger: '#scene',
      pin: true,
      scrub: 1.2,
      invalidateOnRefresh: true,
      end: () => '+=' + (track.scrollWidth - window.innerWidth)
    }
  });
}

/* ── Chapter Dot Reveal ───────────────────────────────── */
function initDotAnimations() {
  document.querySelectorAll('.marker-dot').forEach((dot) => {
    const chapter = dot.closest('.chapter');
    gsap.to(dot, {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      ease: 'back.out(2)',
      scrollTrigger: {
        trigger: chapter,
        // containerAnimation drives the proxy scroll on desktop;
        // on mobile/tablet use plain vertical scroll (no containerAnimation)
        ...(isDesktop()
          ? { containerAnimation: hScrollTween, start: 'left 70%' }
          : { start: 'top 75%' }
        ),
        toggleActions: 'play none none none',
        onEnter: () => dot.classList.add('dot-pulse')
      }
    });
  });
}

/* ── Polaroid Stagger Reveal ──────────────────────────── */
function initPolaroidReveal() {
  document.querySelectorAll('.chapter').forEach((chapter) => {
    const poloids = chapter.querySelectorAll('.polaroid');

    poloids.forEach((pol, i) => {
      const fromAbove = i % 2 === 0;
      // Read the CSS custom property value (e.g. " -6deg" → -6)
      const startRot = parseFloat(pol.style.getPropertyValue('--rot')) || 0;
      const initRot  = startRot + (fromAbove ? 16 : -16);

      gsap.fromTo(pol,
        { opacity: 0, y: fromAbove ? -55 : 55, rotation: initRot },
        {
          opacity: 1,
          y: 0,
          rotation: startRot,
          duration: 0.75,
          ease: 'power3.out',
          delay: i * 0.12,
          // After GSAP finishes, clear the inline transform so CSS
          // hover transitions (rotate + translateY) take over cleanly.
          // Opacity is left as GSAP inline (opacity:1) — intentional.
          onComplete() {
            gsap.set(pol, { clearProps: 'transform' });
          },
          scrollTrigger: {
            trigger: chapter,
            ...(isDesktop()
              ? { containerAnimation: hScrollTween, start: 'left 68%' }
              : { start: 'top 78%' }
            ),
            toggleActions: 'play none none none'
          }
        }
      );
    });
  });
}

/* ── Init ─────────────────────────────────────────────── */
window.addEventListener('load', () => {
  // safe to start animations here
  initHorizontalScroll();
  introTl.play();
});

// Yield one frame so hScrollTween's ScrollTrigger is fully registered
// before nested containerAnimation references are created
requestAnimationFrame(() => {
  initDotAnimations();
  initPolaroidReveal();
  ScrollTrigger.refresh();
});

/* ── Resize: rebuild all scroll-driven logic ──────────── */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Tear down everything
    ScrollTrigger.getAll().forEach(st => st.kill());
    if (hScrollTween) { hScrollTween.kill(); hScrollTween = null; }

    // Reset positions
    const track = document.getElementById('track');
    gsap.set(track, { x: 0 });

    // Ensure all content is fully visible after resize
    document.querySelectorAll('.marker-dot').forEach(d => {
      gsap.set(d, { opacity: 1, scale: 1 });
      d.classList.add('dot-pulse');
    });
    document.querySelectorAll('.polaroid').forEach(p => {
      gsap.set(p, { clearProps: 'all' });
    });

    // Rebuild
    initHorizontalScroll();
    requestAnimationFrame(() => {
      initDotAnimations();
      initPolaroidReveal();
      ScrollTrigger.refresh();
    });
  }, 280);
});

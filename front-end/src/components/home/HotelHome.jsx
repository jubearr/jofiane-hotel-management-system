import React, { useEffect, useRef, useState } from 'react';
import logo from '../../assets/Jofiane-logo.png';
import hotelImage from '../../assets/hotel-background.jpg';
import retreatImage from '../../assets/login-bg.jpg';
import './HotelHome.css';

const roomCollection = [
  { name: 'Garden Room', note: 'Room to slow down.', amenities: 'King-size bed · Smart TV', variant: 'garden' },
  { name: 'Veranda Suite', note: 'A little more room to unwind.', amenities: 'Private balcony · Wi-Fi · Mini bar', variant: 'veranda' },
  { name: 'Amber Loft', note: 'Your own quiet corner.', amenities: 'Private balcony · Smart TV', variant: 'amber' },
  { name: 'Ivory Suite', note: 'Light, space, and calm.', amenities: 'Sofa lounge · Wi-Fi · Smart TV · Mini bar', variant: 'ivory' },
  { name: 'Cedar Retreat', note: 'Warm tones, restful nights.', amenities: 'King-size bed · Rain shower · Smart TV', variant: 'cedar' },
];

function Arrow({ direction = 'right' }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`hotel-arrow hotel-arrow-${direction}`}><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

function RoomIllustration({ variant }) {
  return (
    <div className={`hotel-room-art hotel-room-art-${variant}`} aria-hidden="true">
      <div className="hotel-room-window"><i /><i /><i /></div>
      <div className="hotel-room-lamp" />
      <div className="hotel-room-headboard" />
      <div className="hotel-room-bed"><span /><span /></div>
      <div className="hotel-room-bench" />
      <span className="hotel-room-art-label">THE JO FIANE COLLECTION</span>
    </div>
  );
}

export default function HotelHome({ isLoggedIn, expired, onReturn }) {
  const page = useRef(null);
  const rail = useRef(null);
  const title = useRef(null);
  const menu = useRef(null);
  const menuTrigger = useRef(null);
  const menuDestination = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const prefersReduced = () =>
    typeof window !== 'undefined' &&
    Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  const [motionPaused, setMotionPaused] = useState(() => prefersReduced());
  const [pageHidden, setPageHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [activeSection, setActiveSection] = useState('hotel-hero');

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const syncPreference = (event) => setMotionPaused(event.matches);
    const syncVisibility = () => setPageHidden(document.hidden);
    preference?.addEventListener?.('change', syncPreference);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      preference?.removeEventListener?.('change', syncPreference);
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, []);

  const explore = (event, id) => {
    event.preventDefault();
    setMenuOpen(false);
    const reduced = motionPaused;
    const section = document.getElementById(id);
    if (menuOpen) menuDestination.current = section?.querySelector('h1,h2');
    section?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    section?.querySelector('h1,h2')?.focus({ preventScroll: true });
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menu.current?.querySelector('button')?.focus();
    const keyboard = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if (event.key !== 'Tab') return;
      const controls = menu.current?.querySelectorAll('a,button');
      if (!controls?.length) return;
      const first = controls[0]; const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    const trigger = menuTrigger.current;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keyboard);
      (menuDestination.current || trigger)?.focus({ preventScroll: true });
      menuDestination.current = null;
    };
  }, [menuOpen]);

  useEffect(() => {
    const surface = page.current;
    let frame = 0;
    const update = () => {
      frame = 0;
      const scroll = window.scrollY;
      const distance = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      surface?.style.setProperty('--hotel-progress', String(Math.min(1, scroll / distance)));
      // Leave the camera at its current position while paused, rather than jumping.
      if (!motionPaused && !pageHidden) surface?.style.setProperty('--hotel-parallax', `${Math.min(scroll * .2, 180)}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [motionPaused, pageHidden]);

  useEffect(() => {
    document.documentElement.classList.add('hotel-home-active');
    document.body.classList.add('hotel-home-active');
    document.title = 'Jo Fiane Hotel · A quieter kind of luxury';
    title.current?.focus({ preventScroll: true });
    if (typeof IntersectionObserver === 'undefined') return () => {
      document.documentElement.classList.remove('hotel-home-active');
      document.body.classList.remove('hotel-home-active');
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    page.current?.classList.add('hotel-reveal-ready');
    page.current?.querySelectorAll('[data-hotel-reveal]').forEach((element) => observer.observe(element));
    const sections = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    page.current?.querySelectorAll('section[id]').forEach((section) => sections.observe(section));
    return () => {
      document.documentElement.classList.remove('hotel-home-active');
      document.body.classList.remove('hotel-home-active');
      observer.disconnect();
      sections.disconnect();
    };
  }, []);

  const moveRooms = (direction) => {
    const reducedMotion = motionPaused;
    rail.current?.scrollBy({ left: direction * (rail.current.clientWidth * 0.72), behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className={`hotel-home${motionPaused ? ' hotel-motion-paused' : ''}`} data-motion={motionPaused || pageHidden ? 'paused' : 'running'} ref={page}>
      <div className="hotel-reading-progress" aria-hidden="true" />
      <a className="hotel-skip-link" href="#hotel-introduction" onClick={(event) => explore(event, 'hotel-introduction')}>Skip to hotel information</a>
      <header className="hotel-header">
        <a href="#hotel-hero" onClick={(event) => explore(event, 'hotel-hero')} className="hotel-brand" aria-label="Jo Fiane Hotel home"><img src={logo} alt="Jo Fiane Hotel" /></a>
        <nav aria-label="Hotel navigation">{[['hotel-introduction','The hotel'],['hotel-rooms','Our rooms'],['hotel-details','The details']].map(([id,label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? 'location' : undefined} onClick={(event) => explore(event,id)}>{label}</a>)}</nav>
        <button type="button" ref={menuTrigger} className="hotel-menu-trigger" aria-label="Open hotel menu" aria-expanded={menuOpen} aria-controls="hotel-menu" onClick={() => setMenuOpen(true)}><span>Explore</span><i aria-hidden="true"><b /><b /></i></button>
        <button type="button" className="hotel-portal-button" onClick={onReturn}>Return to Employee Portal <Arrow /></button>
      </header>

      {menuOpen && <div className="hotel-menu-overlay" id="hotel-menu" ref={menu} role="dialog" aria-modal="true" aria-label="Explore Jo Fiane Hotel">
        <div className="hotel-menu-top"><img src={logo} alt="Jo Fiane Hotel" /><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close hotel menu">Close <span aria-hidden="true">×</span></button></div>
        <p className="hotel-eyebrow">MAKE YOURSELF AT HOME</p>
        <nav aria-label="Explore the hotel">{[['hotel-hero','Welcome'],['hotel-introduction','The experience'],['hotel-rooms','Our collection'],['hotel-details','The details']].map(([id,label],index) => <a key={id} style={{'--menu-index':index}} href={`#${id}`} onClick={(event) => explore(event,id)}><small>0{index + 1}</small><span>{label}</span><Arrow /></a>)}</nav>
        <button type="button" className="hotel-portal-button" onClick={onReturn}>Return to Employee Portal <Arrow /></button>
        <span className="hotel-menu-watermark" aria-hidden="true">Jo Fiane.</span>
      </div>}

      <button type="button" className="hotel-motion-control" aria-pressed={motionPaused} onClick={() => setMotionPaused((paused) => !paused)}><span className="hotel-motion-indicator" aria-hidden="true"><i /><i /><i /></span>{motionPaused ? 'Play motion' : 'Pause motion'} <span aria-hidden="true">{motionPaused ? '▷' : 'Ⅱ'}</span></button>

      {expired && (
        <div className="hotel-session-notice" role="alert">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
          <p>You have been logged out due to 30 minutes of inactivity for security purposes.</p>
          <button type="button" onClick={onReturn}>Sign in again <Arrow /></button>
        </div>
      )}

      <main>
        <section className="hotel-hero" id="hotel-hero" aria-labelledby="hotel-heading">
          <div className="hotel-hero-camera" aria-hidden="true"><div className="hotel-hero-image" style={{ backgroundImage: `url(${retreatImage})` }} /></div>
          <div className="hotel-hero-shade" />
          <div className="hotel-light-orbit" aria-hidden="true" />
          <div className="hotel-hero-copy">
            <p className="hotel-eyebrow"><span /> WELCOME TO JO FIANE HOTEL</p>
            <h1 id="hotel-heading" tabIndex="-1" ref={title}><span className="hotel-title-line"><span>A quieter kind</span></span><span className="hotel-title-line"><span>of <em>luxury.</em></span></span></h1>
            <p className="hotel-hero-description">Space to settle in. Time to slow down.<br />Thoughtful hospitality, in every detail.</p>
            <a className="hotel-explore-link" href="#hotel-rooms" onClick={(event) => explore(event,'hotel-rooms')}>Explore the collection <span><Arrow direction="down" /></span></a>
          </div>
          <div className="hotel-hero-bottom">
            <span className="hotel-scroll-cue"><span /> SCROLL TO DISCOVER</span>
            <div className="hotel-welcome-note" aria-label="Jo Fiane Hotel — at a glance">
              <div className="hotel-welcome-signature">
                <span className="hotel-welcome-mark">J.</span>
                <span className="hotel-welcome-sig-line" aria-hidden="true" />
              </div>
              <div className="hotel-welcome-body">
                <p className="hotel-welcome-tagline">A warm welcome.<br /><strong>A memorable stay.</strong></p>
                <div className="hotel-welcome-stats" aria-label="Hotel highlights">
                  <div className="hotel-welcome-stat">
                    <span className="hotel-stat-value">5</span>
                    <span className="hotel-stat-label">Room types</span>
                  </div>
                  <div className="hotel-welcome-stat-divider" aria-hidden="true" />
                  <div className="hotel-welcome-stat">
                    <span className="hotel-stat-value">24/7</span>
                    <span className="hotel-stat-label">Front desk</span>
                  </div>
                  <div className="hotel-welcome-stat-divider" aria-hidden="true" />
                  <div className="hotel-welcome-stat">
                    <span className="hotel-stat-value hotel-stat-available"><span className="hotel-stat-dot" aria-hidden="true" />Now open</span>
                    <span className="hotel-stat-label">Availability</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="hotel-marquee" aria-hidden="true"><div>{[0,1].map((copy) => <span key={copy}>ARRIVE. <em>Exhale.</em> STAY A LITTLE LONGER. <b>✦</b> JO FIANE. <em>Feel at home.</em> <b>✦</b> </span>)}</div></div>

        <section className="hotel-introduction hotel-section" id="hotel-introduction" aria-labelledby="hotel-intro-heading">
          <div data-hotel-reveal>
            <p className="hotel-eyebrow">01 / THE JO FIANE EXPERIENCE</p>
            <h2 id="hotel-intro-heading" tabIndex="-1">Some places invite you<br />to <em>stay a little longer.</em></h2>
          </div>
          <div className="hotel-intro-note" data-hotel-reveal><p>From your first welcome to your last goodnight, our team is here to help you feel at home.</p><p>Explore our room collection and the little comforts that make a stay your own.</p><a href="#hotel-details" onClick={(event) => explore(event,'hotel-details')}>It's all in the details <Arrow /></a></div>
        </section>

        <section className="hotel-rooms-section" id="hotel-rooms" aria-labelledby="hotel-rooms-heading">
          <div className="hotel-section-heading hotel-section" data-hotel-reveal>
            <div><p className="hotel-eyebrow">02 / FIND YOUR QUIET</p><h2 id="hotel-rooms-heading" tabIndex="-1">Rooms with <em>character.</em></h2></div>
            <div className="hotel-rail-controls"><span>Discover the collection</span><button type="button" onClick={() => moveRooms(-1)} aria-label="Previous rooms"><Arrow direction="left" /></button><button type="button" onClick={() => moveRooms(1)} aria-label="Next rooms"><Arrow /></button></div>
          </div>
          <div className="hotel-room-rail" ref={rail} tabIndex="0" role="region" aria-label="Room collection. Scroll horizontally to explore.">
            {roomCollection.map((room, index) => (
              <article className="hotel-room-card" key={room.name} data-hotel-reveal style={{'--reveal-delay':`${index * 90}ms`}}>
                <RoomIllustration variant={room.variant} />
                <div className="hotel-room-info"><span className="hotel-room-index">0{index + 1}</span><div><h3>{room.name}</h3><p>{room.note}</p><span className="hotel-room-amenities">{room.amenities}</span></div><Arrow /></div>
              </article>
            ))}
          </div>
          <p className="hotel-collection-caption">Illustrative room previews. Ask our front desk about room details and availability.</p>
        </section>

        <section className="hotel-details hotel-section" id="hotel-details" aria-labelledby="hotel-details-heading">
          <div className="hotel-details-image" data-hotel-reveal><img src={hotelImage} alt="The hotel's warmly illuminated exterior in the evening" loading="lazy" /><span>AFTER THE DAY, A WARM WELCOME.</span></div>
          <div className="hotel-details-copy" data-hotel-reveal>
            <p className="hotel-eyebrow">03 / CONSIDERED COMFORTS</p>
            <h2 id="hotel-details-heading" tabIndex="-1">The little things.<br /><em>Beautifully considered.</em></h2>
            <div className="hotel-amenity"><span>01</span><div><h3>A space of your own</h3><p>From our Garden Room to our suites, find the right setting for your stay.</p></div></div>
            <div className="hotel-amenity"><span>02</span><div><h3>Everyday comforts</h3><p>Explore rooms with Wi-Fi, smart TVs, and private balconies. Amenities vary by room.</p></div></div>
            <div className="hotel-amenity"><span>03</span><div><h3>People who care</h3><p>Our front desk and housekeeping teams are here to make you feel welcome.</p></div></div>
          </div>
        </section>

        <section className="hotel-closing hotel-section" data-hotel-reveal>
          <p className="hotel-eyebrow">JO FIANE HOTEL</p>
          <h2>A place to return to.<br /><em>A welcome to remember.</em></h2>
          <a href="#hotel-hero" onClick={(event) => explore(event,'hotel-hero')}>Back to the beginning <Arrow direction="up" /></a>
        </section>
      </main>
      <footer className="hotel-footer"><img src={logo} alt="Jo Fiane Hotel" /><span>Thoughtful stays. Lasting impressions.</span><button type="button" onClick={onReturn}>{isLoggedIn ? 'Resume your workspace' : 'Employee sign in'} <Arrow /></button></footer>
    </div>
  );
}

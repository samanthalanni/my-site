(async function(){
  const el = document.getElementById('weather');
  if(!el) return;
  const main = el.querySelector('.weather-main');
  const sub = el.querySelector('.weather-sub');
  const location = el.querySelector('.weather-location');

  function setError(msg){
    main.textContent = msg;
    sub.textContent = '';
    location.textContent = '';
  }

  function weatherEmoji(code){
    if(code === null || code === undefined) return '🌈';
    if(code === 0) return '☀️';
    if(code >= 1 && code <= 3) return '⛅';
    if((code >= 45 && code <= 48) || (code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
    if((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
    if(code >= 95 && code <= 99) return '⛈️';
    return '🌤️';
  }

  function formatTemp(f){
    return Math.round(f) + '°F';
  }

  function fetchWeather(lat, lon){
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&temperature_unit=fahrenheit&timezone=auto`;
    return fetch(url).then(r=>{
      if(!r.ok) throw new Error('Weather API error');
      return r.json();
    });
  }

  async function fetchLocationName(lat, lon){
    try{
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const r = await fetch(url);
      if(!r.ok) return null;
      const data = await r.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county;
      return city || null;
    }catch(e){
      return null;
    }
  }

  if(!navigator.geolocation){
    setError('Location not supported');
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    try{
      const lat = pos.coords.latitude.toFixed(4);
      const lon = pos.coords.longitude.toFixed(4);
      const data = await fetchWeather(lat, lon);
      const cw = data.current_weather;
      if(!cw){ setError('No current weather'); return; }
      const emoji = weatherEmoji(cw.weathercode);
      main.innerHTML = `<span class="weather-emoji">${emoji}</span><span>${formatTemp(cw.temperature)}</span>`;
      
      // Add today's high/low temps
      if(data.daily && data.daily.temperature_2m_max && data.daily.temperature_2m_min){
        const todayHigh = Math.round(data.daily.temperature_2m_max[0]);
        const todayLow = Math.round(data.daily.temperature_2m_min[0]);
        sub.textContent = `High ${todayHigh}° / Low ${todayLow}°`;
      }
      
      const locationName = await fetchLocationName(lat, lon);
      if(locationName){
        location.textContent = `${locationName} 📍`;
      }

      // Weekly forecast removed — showing today's weather only
    }catch(e){
      setError('Unable to load weather');
    }
  }, err => {
    if(err.code === 1) setError('Enable location to see your weather.');
    else setError('Location error');
  });
})();

// Text ripple effect on cursor move
(function(){
  const targets = document.querySelectorAll('.hero-copy, #about-me h2, #about-me p, #contact h2, #contact p');
  if(!targets.length) return;

  function wrapChars(node, preserveWords) {
    if(node.nodeType === Node.TEXT_NODE) {
      const fragment = document.createDocumentFragment();
      const text = node.textContent || '';
      if(preserveWords) {
        text.split(/(\s+)/).forEach(token => {
          if(token === '') return;
          if(/\s+/.test(token)) {
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'ripple-space';
            spaceSpan.textContent = token;
            fragment.appendChild(spaceSpan);
            return;
          }
          const wordSpan = document.createElement('span');
          wordSpan.className = 'ripple-word';
          token.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'ripple-char';
            charSpan.textContent = char;
            wordSpan.appendChild(charSpan);
          });
          fragment.appendChild(wordSpan);
        });
      } else {
        text.split('').forEach(char => {
          const charSpan = document.createElement('span');
          charSpan.className = 'ripple-char';
          if(char === ' ') {
            charSpan.classList.add('ripple-space');
            charSpan.textContent = '\u00A0';
          } else {
            charSpan.textContent = char;
          }
          fragment.appendChild(charSpan);
        });
      }
      return fragment;
    }
    if(node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      node.childNodes.forEach(child => {
        clone.appendChild(wrapChars(child, preserveWords));
      });
      return clone;
    }
    return node.cloneNode(true);
  }

  function attachRippleEffect(el) {
    const preserveWords = el.matches('#about-me p');
    const wrapped = wrapChars(el, preserveWords);
    el.innerHTML = '';
    el.appendChild(wrapped);

    const chars = el.querySelectorAll('.ripple-char');
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      chars.forEach(char => {
        if(char.classList.contains('ripple-space')) return;
        const charRect = char.getBoundingClientRect();
        const charCenterX = charRect.left - rect.left + charRect.width / 2;
        const charCenterY = charRect.top - rect.top + charRect.height / 2;

        const distance = Math.sqrt(
          Math.pow(mouseX - charCenterX, 2) +
          Math.pow(mouseY - charCenterY, 2)
        );

        const maxDistance = 100;
        const scale = Math.max(1, 1.4 - (distance / maxDistance) * 0.4);
        char.style.transform = `scale(${scale})`;
      });
    });

    el.addEventListener('mouseleave', () => {
      chars.forEach(char => {
        if(char.classList.contains('ripple-space')) return;
        char.style.transform = 'scale(1)';
      });
    });
  }

  targets.forEach(attachRippleEffect);
})();

// Scroll button → navigate to next section or return home
(function(){
  const btn = document.getElementById('scroll-btn');
  const scrollArrow = btn ? btn.querySelector('.scroll-arrow') : null;
  const scrollLabel = btn ? btn.querySelector('.scroll-label') : null;
  
  if(!btn || !scrollArrow || !scrollLabel) return;
  
  function updateButtonMode(){
    const heroSection = document.querySelector('.hero');
    const aboutSection = document.getElementById('about-me');
    const contactSection = document.getElementById('contact');
    
    if(!heroSection || !aboutSection || !contactSection) return;
    
    const aboutRect = aboutSection.getBoundingClientRect();
    const contactRect = contactSection.getBoundingClientRect();
    const aboutInView = aboutRect.top < window.innerHeight * 0.6 && aboutRect.bottom > window.innerHeight * 0.4;
    const contactInView = contactRect.top < window.innerHeight * 0.75;
    
    if(contactInView){
      // Contact section is in view - show HOME button
      btn.classList.remove('scroll-mode');
      btn.classList.remove('about-mode');
      btn.classList.add('home-mode');
      btn.classList.add('at-contact');
      scrollLabel.textContent = 'HOME';
      scrollArrow.textContent = '↑';
      btn.setAttribute('aria-label', 'Return home');
    } else if(aboutInView) {
      // About section in view - show arrow only
      btn.classList.remove('home-mode');
      btn.classList.add('scroll-mode');
      btn.classList.add('about-mode');
      btn.classList.remove('at-contact');
      scrollLabel.textContent = 'SCROLL';
      scrollArrow.textContent = '↓';
      btn.setAttribute('aria-label', 'Scroll to contact');
    } else {
      // Not in contact - show SCROLL button
      btn.classList.remove('home-mode');
      btn.classList.remove('about-mode');
      btn.classList.remove('at-contact');
      btn.classList.add('scroll-mode');
      scrollLabel.textContent = 'SCROLL';
      scrollArrow.textContent = '↓';
      btn.setAttribute('aria-label', 'Scroll down');
    }
  }
  
  btn.addEventListener('click', () => {
    const heroSection = document.querySelector('.hero');
    const aboutSection = document.getElementById('about-me');
    const contactSection = document.getElementById('contact');
    
    if(!heroSection || !aboutSection || !contactSection) return;
    
    if(btn.classList.contains('home-mode')){
      // Return to home
      heroSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Navigate to next section
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if(heroBottom > window.innerHeight / 2){
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
  
  // Update button mode on scroll
  window.addEventListener('scroll', updateButtonMode);
  updateButtonMode(); // Check on load
})();

// Scroll slide-up / slide-down transitions via IntersectionObserver
(function(){
  const targets = document.querySelectorAll('.section-animate');
  if(!targets.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      // Skip the hero — always visible
      if(el.classList.contains('hero')) return;

      if(entry.isIntersecting){
        el.classList.remove('slide-down');
        el.classList.add('is-visible');
      } else {
        // Determine which side the element exited from
        const above = entry.boundingClientRect.top < 0;
        if(above){
          // Section scrolled above viewport → slide-down when it comes back
          el.classList.remove('is-visible');
          el.classList.add('slide-down');
        } else {
          // Section is below viewport → reset to slide-up state
          el.classList.remove('is-visible', 'slide-down');
        }
      }
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));
})();

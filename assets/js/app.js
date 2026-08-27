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
        location.textContent = `📍 ${locationName}`;
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

// Text ripple effect on hover
(function(){
  const aboutCopy = document.querySelector('.about-copy');
  if(!aboutCopy) return;
  
  // Recursively wrap text nodes in spans while preserving HTML elements
  function wrapChars(node) {
    if(node.nodeType === Node.TEXT_NODE) {
      const span = document.createElement('span');
      node.textContent.split('').forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.className = 'ripple-char';
        if(char === ' ') {
          charSpan.classList.add('ripple-space');
          charSpan.textContent = '\u00A0';
        } else {
          charSpan.textContent = char;
        }
        span.appendChild(charSpan);
      });
      return span;
    } else if(node.nodeType === Node.ELEMENT_NODE) {
      const clone = node.cloneNode(false);
      node.childNodes.forEach(child => {
        clone.appendChild(wrapChars(child));
      });
      return clone;
    }
    return node.cloneNode(true);
  }
  
  // Wrap all text
  const wrapped = wrapChars(aboutCopy);
  aboutCopy.innerHTML = wrapped.innerHTML;
  
  const chars = aboutCopy.querySelectorAll('.ripple-char');
  
  aboutCopy.addEventListener('mousemove', (e) => {
    const rect = aboutCopy.getBoundingClientRect();
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
  
  aboutCopy.addEventListener('mouseleave', () => {
    chars.forEach(char => {
      if(char.classList.contains('ripple-space')) return;
      char.style.transform = 'scale(1)';
    });
  });
})();

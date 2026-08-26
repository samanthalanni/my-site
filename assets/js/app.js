(async function(){
  const el = document.getElementById('weather');
  if(!el) return;
  const main = el.querySelector('.weather-main');
  const sub = el.querySelector('.weather-sub');

  function setError(msg){
    main.textContent = msg;
    sub.textContent = '';
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit&timezone=auto`;
    return fetch(url).then(r=>{
      if(!r.ok) throw new Error('Weather API error');
      return r.json();
    });
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
      sub.textContent = `Updated: ${new Date(cw.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }catch(e){
      setError('Unable to load weather');
    }
  }, err => {
    if(err.code === 1) setError('Enable location to see your weather.');
    else setError('Location error');
  });
})();

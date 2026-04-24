const API_KEY = "3428ba779404110b6b19bb4f7c26a3d8";
let units = "metric";
let currentWeatherData = null;
let currentForecastData = null;
let chartInstance = null;

// Theme Toggle
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
});

// Unit Toggle
const unitToggle = document.getElementById('unit-toggle');
unitToggle.addEventListener('click', () => {
  units = units === 'metric' ? 'imperial' : 'metric';
  unitToggle.textContent = units === 'metric' ? '°F' : '°C';
  if (currentWeatherData) {
    const city = currentWeatherData.name;
    loadWeather(city);
  }
});

// Weather Animation
function createWeatherAnimation(condition) {
  const container = document.getElementById('weather-animation');
  container.innerHTML = '';

  if (condition.includes('rain') || condition.includes('drizzle')) {
    for (let i = 0; i < 50; i++) {
      const drop = document.createElement('div');
      drop.className = 'raindrop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
      drop.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(drop);
    }
  } else if (condition.includes('snow')) {
    for (let i = 0; i < 30; i++) {
      const flake = document.createElement('div');
      flake.className = 'snowflake';
      flake.textContent = '❄';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.animationDuration = (Math.random() * 3 + 2) + 's';
      flake.style.animationDelay = Math.random() * 2 + 's';
      container.appendChild(flake);
    }
  } else if (condition.includes('cloud')) {
    for (let i = 0; i < 5; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'cloud';
      cloud.style.top = Math.random() * 50 + '%';
      cloud.style.animationDelay = Math.random() * 10 + 's';
      container.appendChild(cloud);
    }
  }
}

// Recent Searches - Save last city only
function addToRecentSearches(city) {
  localStorage.setItem("lastCity", city);
}

// Temperature Chart
function renderChart(forecastList) {
  const ctx = document.getElementById('tempChart').getContext('2d');

  const labels = [];
  const temps = [];

  forecastList.slice(0, 8).forEach(item => {
    const date = new Date(item.dt_txt);
    labels.push(date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }));
    temps.push(Math.round(item.main.temp));
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Temperature (°${units === 'metric' ? 'C' : 'F'})`,
        data: temps,
        borderColor: '#4cc9f0',
        backgroundColor: 'rgba(76, 201, 240, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text')
          }
        }
      },
      scales: {
        y: {
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        x: {
          ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text') },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

async function fetchWeatherByCity(city) {
  const q = encodeURIComponent(city);
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${q}&units=${units}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("City not found");
  return res.json();
}

async function fetchForecastByCity(city) {
  const q = encodeURIComponent(city);
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${q}&units=${units}&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Forecast not available");
  return res.json();
}

function renderCurrent(data) {
  const el = document.getElementById("current");
  if (!data) {
    el.innerHTML = "<p>No data</p>";
    return;
  }
  const name = data.name;
  const temp = Math.round(data.main.temp);
  const feelsLike = Math.round(data.main.feels_like);
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;
  const humidity = data.main.humidity;
  const pressure = data.main.pressure;
  const visibility = (data.visibility / 1000).toFixed(1);
  const windSpeed = data.wind.speed;
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  el.innerHTML = `
    <div class="weather-main">
      <div class="left">
        <h3>${name}</h3>
        <p><strong style="font-size: 2.5rem;">${temp}°${units === 'metric' ? 'C' : 'F'}</strong></p>
        <p style="text-transform: capitalize;">${desc}</p>
        <p style="opacity: 0.8;">Feels like ${feelsLike}°${units === 'metric' ? 'C' : 'F'}</p>
      </div>
      <div class="right">
        <img alt="" src="http://openweathermap.org/img/wn/${icon}@4x.png" style="width: 150px;" />
      </div>
    </div>
    <div class="weather-details">
      <div class="detail-item"><strong>💧 ${humidity}%</strong><span>Humidity</span></div>
      <div class="detail-item"><strong>🌪️ ${windSpeed} ${units === 'metric' ? 'm/s' : 'mph'}</strong><span>Wind Speed</span></div>
      <div class="detail-item"><strong>🔽 ${pressure} hPa</strong><span>Pressure</span></div>
      <div class="detail-item"><strong>👁️ ${visibility} km</strong><span>Visibility</span></div>
      <div class="detail-item"><strong>🌅 ${sunrise}</strong><span>Sunrise</span></div>
      <div class="detail-item"><strong>🌇 ${sunset}</strong><span>Sunset</span></div>
    </div>
  `;

  createWeatherAnimation(desc);
}

function renderForecast(list) {
  const el = document.getElementById("forecast");
  if (!list || !list.length) {
    el.innerHTML = "<p>No forecast</p>";
    return;
  }

  const dayMap = new Map();
  list.forEach(item => {
    const date = new Date(item.dt_txt);
    const key = date.toDateString();
    const hour = date.getHours();
    if (!dayMap.has(key) && hour === 12) {
      dayMap.set(key, item);
    }
  });

  el.innerHTML = "";
  dayMap.forEach(item => {
    const d = new Date(item.dt * 1000);
    const day = d.toDateString().split(' ').slice(0, 3).join(' ');
    const temp = Math.round(item.main.temp);
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;
    const humidity = item.main.humidity;
    const windSpeed = item.wind.speed;

    el.innerHTML += `
      <div class="card">
        <div><strong>${day}</strong></div>
        <img alt="" src="http://openweathermap.org/img/wn/${icon}@2x.png" />
        <div style="font-size: 1.5rem; font-weight: bold; margin: 0.5rem 0;">${temp}°${units === 'metric' ? 'C' : 'F'}</div>
        <div style="opacity: 0.8; text-transform: capitalize; font-size: 0.9rem; margin-bottom: 0.5rem;">${desc}</div>
        <div style="font-size: 0.85rem; opacity: 0.9; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
          <div style="margin: 0.25rem 0;">💧 ${humidity}%</div>
          <div style="margin: 0.25rem 0;">🌪️ ${windSpeed} ${units === 'metric' ? 'm/s' : 'mph'}</div>
        </div>
      </div>
    `;
  });
}

async function loadWeather(city) {
  try {
    const current = await fetchWeatherByCity(city);
    currentWeatherData = current;
    renderCurrent(current);

    const forecast = await fetchForecastByCity(city);
    currentForecastData = forecast;
    renderForecast(forecast.list);
    renderChart(forecast.list);

    addToRecentSearches(city);
  } catch (e) {
    alert("Could not fetch weather: " + e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const geoBtn = document.getElementById("geo-btn");

  searchBtn.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (city) loadWeather(city);
  });

  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const city = cityInput.value.trim();
      if (city) loadWeather(city);
    }
  });

  geoBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
          const res = await fetch(url);
          const current = await res.json();
          currentWeatherData = current;
          renderCurrent(current);

          const fUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${API_KEY}`;
          const fRes = await fetch(fUrl);
          const forecast = await fRes.json();
          currentForecastData = forecast;
          renderForecast(forecast.list);
          renderChart(forecast.list);

          addToRecentSearches(current.name);
        } catch (err) {
          alert("Location weather failed: " + err.message);
        }
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });

  // Keep search bar empty on refresh - NO DATA LOADED
  cityInput.value = "";
  document.getElementById("current").innerHTML = "<p style='text-align: center; opacity: 0.7;'>Search for a city to see weather</p>";
  document.getElementById("forecast").innerHTML = "<p style='text-align: center; opacity: 0.7;'>Forecast will appear here</p>";
});
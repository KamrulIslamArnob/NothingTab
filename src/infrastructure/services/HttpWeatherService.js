import { WeatherService } from "../../application/ports/WeatherService.js";

// Infrastructure adapter: HttpWeatherService
// Connects to free Open-Meteo geocoding and forecasting API endpoints.
export class HttpWeatherService extends WeatherService {
  async fetchWeather(location, unit, { signal } = {}) {
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl, { signal });
      if (!geoRes.ok) throw new Error("Location lookup failed");
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location "${location}" not found`);
      }

      const match = geoData.results[0];
      const lat = match.latitude;
      const lon = match.longitude;
      const locationName = match.country
        ? `${match.name}, ${match.country}`
        : match.name;

      const tempUnit = unit === "f" ? "fahrenheit" : "celsius";
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=${tempUnit}`;
      const weatherRes = await fetch(weatherUrl, { signal });
      if (!weatherRes.ok) throw new Error("Weather forecast fetch failed");
      const weatherData = await weatherRes.json();

      const current = weatherData.current_weather;
      if (!current) throw new Error("No current weather data returned");

      return {
        locationName,
        temp: Math.round(current.temperature),
        condition: this.describeWeatherCode(current.weathercode),
      };
    } catch (err) {
      console.error("HttpWeatherService error:", err);
      throw err;
    }
  }

  describeWeatherCode(code) {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if ([51, 53, 55].includes(code)) return "Drizzling";
    if ([56, 57].includes(code)) return "Freezing drizzle";
    if ([61, 63, 65].includes(code)) return "Rainy";
    if ([66, 67].includes(code)) return "Freezing rain";
    if ([71, 73, 75].includes(code)) return "Snowy";
    if (code === 77) return "Snow grains";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([85, 86].includes(code)) return "Snow showers";
    if (code === 95) return "Thunderstorm";
    if ([96, 99].includes(code)) return "Thunderstorm with hail";
    return "Unknown weather";
  }
}

// Application port: WeatherService
// Driven interface for fetching current weather data.
export class WeatherService {
  /**
   * @param {string} location The search query/location (e.g. "Dhaka")
   * @param {string} unit Temperature unit: "c" or "f"
   * @returns {Promise<{ locationName: string, temp: number, condition: string }>}
   */
  async fetchWeather(location, unit) {
    throw new Error("not implemented");
  }
}

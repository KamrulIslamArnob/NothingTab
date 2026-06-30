// Application use case: GetWeatherUseCase
export class GetWeatherUseCase {
  #weatherService;

  constructor(weatherService) {
    this.#weatherService = weatherService;
  }

  async execute({ location, unit }) {
    if (!location || location.trim().length === 0) {
      return null;
    }
    return this.#weatherService.fetchWeather(location, unit);
  }
}

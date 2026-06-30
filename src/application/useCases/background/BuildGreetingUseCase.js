import { Greeting } from "../../../domain/valueObjects/Greeting.js";

// Builds a Greeting value object from current time + current settings.
// Pure orchestration — does not mutate state.
export class BuildGreetingUseCase {
  #settingsRepo;
  #clock;

  constructor({ settingsRepo, clock }) {
    this.#settingsRepo = settingsRepo;
    this.#clock = clock;
  }

  async execute() {
    const settings = await this.#settingsRepo.load();
    return Greeting.fromHour(this.#clock.now().getHours(), settings.name);
  }
}
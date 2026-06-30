import { ClockFormat } from "../../../domain/valueObjects/TimeFormat.js";

export class UpdateTimeFormatUseCase {
  #settingsRepo;
  #events;

  constructor({ settingsRepo, events }) {
    this.#settingsRepo = settingsRepo;
    this.#events = events;
  }

  async execute({ format }) {
    const settings = await this.#settingsRepo.load();
    settings.setTimeFormat(new ClockFormat(format));
    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", undefined);
    return settings;
  }
}
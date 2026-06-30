export class UpdateUserNameUseCase {
  #settingsRepo;
  #sanitizer;
  #events;

  constructor({ settingsRepo, sanitizer, events }) {
    this.#settingsRepo = settingsRepo;
    this.#sanitizer = sanitizer;
    this.#events = events;
  }

  async execute({ name }) {
    const settings = await this.#settingsRepo.load();
    settings.setName(this.#sanitizer.text(name));
    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", undefined);
    return settings;
  }
}
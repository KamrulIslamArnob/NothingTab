// Application usecase: UpdateDailyFocusUseCase
export class UpdateDailyFocusUseCase {
  #settingsRepo;
  #events;

  constructor({ settingsRepo, events }) {
    this.#settingsRepo = settingsRepo;
    this.#events = events;
  }

  async execute({ focusText, focusCompleted, focusDate }) {
    const settings = await this.#settingsRepo.load();
    settings.setFocus(focusText, focusCompleted, focusDate);
    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", settings);
    return settings;
  }
}

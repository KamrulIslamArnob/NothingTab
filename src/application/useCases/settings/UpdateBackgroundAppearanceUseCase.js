// Persists the presentation-layer background adjustments (blur, overlay).
// Kept separate from UpdateBackgroundUseCase so that the dashboard
// can tweak just the overlay without re-uploading the image.
export class UpdateBackgroundAppearanceUseCase {
  #settingsRepo;
  #events;

  constructor({ settingsRepo, events }) {
    this.#settingsRepo = settingsRepo;
    this.#events = events;
  }

  async execute({ blur, overlay }) {
    const settings = await this.#settingsRepo.load();
    if (blur !== undefined) settings.setBackgroundBlur(blur);
    if (overlay !== undefined) settings.setBackgroundOverlay(overlay);
    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", undefined);
    return settings;
  }
}
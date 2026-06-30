import { BackgroundConfig } from "../../../domain/valueObjects/BackgroundConfig.js";

export class UpdateBackgroundUseCase {
  #settingsRepo;
  #events;

  constructor({ settingsRepo, events }) {
    this.#settingsRepo = settingsRepo;
    this.#events = events;
  }

  async execute({ kind, value }) {
    const settings = await this.#settingsRepo.load();
    // Re-constructing through the value object re-validates the input.
    const next = (() => {
      switch (kind) {
        case "local_image":
          return BackgroundConfig.localImage(value);
        case "remote_image":
          return BackgroundConfig.remoteImage(value);
        case "gradient":
          return BackgroundConfig.gradient(value);
        case "solid_color":
        default:
          return BackgroundConfig.solidColor(value);
      }
    })();

    settings.setBackground(next);
    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", undefined);
    return settings;
  }
}
import { BackgroundConfig, BackgroundKind } from "../../../domain/valueObjects/BackgroundConfig.js";
import { ClockFormat, TimeFormat } from "../../../domain/valueObjects/TimeFormat.js";

/**
 * Unified usecase to save all settings fields at once.
 * Only updates fields that are explicitly passed (not undefined).
 */
export class SaveUserSettingsUseCase {
  #settingsRepo;
  #events;

  constructor({ settingsRepo, events }) {
    this.#settingsRepo = settingsRepo;
    this.#events = events;
  }

  async execute(patch) {
    const settings = await this.#settingsRepo.load();

    const simpleFields = [
      "name", "backgroundBlur", "backgroundOverlay", "backgroundTintColor", "buttonRoundness",
      "bgGrayscale", "bgHueRotate", "bgPixelation", "bgVignette", "bgFilmGrain",
      "clocks", "searchEnabled", "searchEngine", "searchOpenNewTab", "themePreset",
      "weatherEnabled", "weatherLocation", "weatherUnit",
      "todoEnabled", "shortcutsEnabled", "shortcutsOpenNewTab", "quickNoteEnabled",
      "customCss", "greetingEnabled", "messageText", "clockEnabled", "showSeconds", "showDate",
      "cssVarBg", "cssVarText", "cssVarBorder", "cssVarAccent"
    ];

    for (const field of simpleFields) {
      if (patch[field] !== undefined) {
        const setterName = `set${field.charAt(0).toUpperCase()}${field.slice(1)}`;
        settings[setterName](patch[field]);
      }
    }

    if (patch.backgroundKind !== undefined && patch.backgroundValue !== undefined) {
      let next;
      switch (patch.backgroundKind) {
        case "local_image": next = BackgroundConfig.localImage(patch.backgroundValue); break;
        case "remote_image": next = BackgroundConfig.remoteImage(patch.backgroundValue); break;
        case "gradient": next = BackgroundConfig.gradient(patch.backgroundValue); break;
        case "solid_color": default: next = BackgroundConfig.solidColor(patch.backgroundValue); break;
      }
      settings.setBackground(next);
    }

    if (patch.timeFormat24h !== undefined) {
      settings.setTimeFormat(new ClockFormat(patch.timeFormat24h ? TimeFormat.H24 : TimeFormat.H12));
    }

    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", settings);
    return settings;
  }
}

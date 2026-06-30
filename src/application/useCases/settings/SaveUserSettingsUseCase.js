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
    const {
      name, backgroundKind, backgroundValue, timeFormat24h,
      backgroundBlur, backgroundOverlay, backgroundTintColor, buttonRoundness,
      bgGrayscale, bgHueRotate, bgPixelation, bgVignette, bgFilmGrain,
      clocks, searchEnabled, searchEngine, searchOpenNewTab, themePreset,
      weatherEnabled, weatherLocation, weatherUnit,
      todoEnabled, shortcutsEnabled, shortcutsOpenNewTab, quickNoteEnabled,
      customCss,
      greetingEnabled, messageText, clockEnabled, showSeconds, showDate,
      cssVarBg, cssVarText, cssVarBorder, cssVarAccent,
    } = patch;

    if (name !== undefined) settings.setName(name);

    if (backgroundKind !== undefined && backgroundValue !== undefined) {
      let next;
      switch (backgroundKind) {
        case "local_image": next = BackgroundConfig.localImage(backgroundValue); break;
        case "remote_image": next = BackgroundConfig.remoteImage(backgroundValue); break;
        case "gradient": next = BackgroundConfig.gradient(backgroundValue); break;
        case "solid_color": default: next = BackgroundConfig.solidColor(backgroundValue); break;
      }
      settings.setBackground(next);
    }

    if (timeFormat24h !== undefined) settings.setTimeFormat(new ClockFormat(timeFormat24h ? TimeFormat.H24 : TimeFormat.H12));
    if (backgroundBlur !== undefined) settings.setBackgroundBlur(backgroundBlur);
    if (backgroundOverlay !== undefined) settings.setBackgroundOverlay(backgroundOverlay);
    if (bgGrayscale !== undefined) settings.setBgGrayscale(bgGrayscale);
    if (bgHueRotate !== undefined) settings.setBgHueRotate(bgHueRotate);
    if (bgPixelation !== undefined) settings.setBgPixelation(bgPixelation);
    if (bgVignette !== undefined) settings.setBgVignette(bgVignette);
    if (bgFilmGrain !== undefined) settings.setBgFilmGrain(bgFilmGrain);
    if (backgroundTintColor !== undefined) settings.setBackgroundTintColor(backgroundTintColor);
    if (buttonRoundness !== undefined) settings.setButtonRoundness(buttonRoundness);
    if (clocks !== undefined) settings.setClocks(clocks);
    if (searchEnabled !== undefined) settings.setSearchEnabled(searchEnabled);
    if (searchEngine !== undefined) settings.setSearchEngine(searchEngine);
    if (searchOpenNewTab !== undefined) settings.setSearchOpenNewTab(searchOpenNewTab);
    if (themePreset !== undefined) settings.setThemePreset(themePreset);
    if (weatherEnabled !== undefined) settings.setWeatherEnabled(weatherEnabled);
    if (weatherLocation !== undefined) settings.setWeatherLocation(weatherLocation);
    if (weatherUnit !== undefined) settings.setWeatherUnit(weatherUnit);
    if (todoEnabled !== undefined) settings.setTodoEnabled(todoEnabled);
    if (shortcutsEnabled !== undefined) settings.setShortcutsEnabled(shortcutsEnabled);
    if (shortcutsOpenNewTab !== undefined) settings.setShortcutsOpenNewTab(shortcutsOpenNewTab);
    if (quickNoteEnabled !== undefined) settings.setQuickNoteEnabled(quickNoteEnabled);
    if (customCss !== undefined) settings.setCustomCss(customCss);
    if (greetingEnabled !== undefined) settings.setGreetingEnabled(greetingEnabled);
    if (messageText !== undefined) settings.setMessageText(messageText);
    if (clockEnabled !== undefined) settings.setClockEnabled(clockEnabled);
    if (showSeconds !== undefined) settings.setShowSeconds(showSeconds);
    if (showDate !== undefined) settings.setShowDate(showDate);
    if (cssVarBg !== undefined) settings.setCssVarBg(cssVarBg);
    if (cssVarText !== undefined) settings.setCssVarText(cssVarText);
    if (cssVarBorder !== undefined) settings.setCssVarBorder(cssVarBorder);
    if (cssVarAccent !== undefined) settings.setCssVarAccent(cssVarAccent);

    await this.#settingsRepo.save(settings);
    this.#events.emit("settings:changed", settings);
    return settings;
  }
}

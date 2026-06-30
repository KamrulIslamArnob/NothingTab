/**
 * Minimal, sync, dependency-free i18n.
 * - One module: English (default) only, but the shape is in place.
 * - All UI strings are pulled from here so the popup/options/newTab
 *   stay in lockstep when copy changes.
 */
const STRINGS = {
  // newTab / popup / options — shared
  appTitle: "HomeScreen",
  save: "Save",
  add: "Add",
  delete: "Delete",
  rename: "Rename",
  cancel: "Cancel",
  openSettings: "Settings",

  // greeting
  greetingMorning: "Good morning",
  greetingAfternoon: "Good afternoon",
  greetingEvening: "Good evening",
  greetingNight: "Working late",

  // clock
  clockAM: "AM",
  clockPM: "PM",

  // todo
  todoPlaceholder: "Add a task and press Enter",
  todoEmpty: "Nothing to do. Add a task above.",
  todoCount: (n) => `${n} task${n === 1 ? "" : "s"}`,
  todoClearDone: "Clear completed",

  // bookmarks
  bookmarksEmpty: "No bookmarks yet. Add some in settings.",
  bookmarksAdd: "Add bookmark",

  // settings popover
  settingsIdentity: "Identity",
  settingsName: "Your name",
  settingsAppearance: "Appearance",
  settingsBlur: "Blur",
  settingsOverlay: "Overlay",
  settings24h: "24-hour clock",
  settingsOpen: "Open all settings",

  // background
  backgroundLabel: "Background",
  backgroundColor: "Color",
  backgroundGradient: "Gradient",
  backgroundImage: "Image URL",
  backgroundDaily: "Daily Unsplash",

  // options page
  optionsTitle: "HomeScreen options",
  optionsSubtitle: "Settings sync to your new-tab page.",
  optionsWidgets: "Widgets",
  optionsCategories: "Categories",
  optionsBookmarks: "Bookmarks",
};

/** Translates a key. Keys that are functions are called with args. */
export function t(key, ...args) {
  const v = STRINGS[key];
  if (typeof v === "function") return v(...args);
  if (v == null) return key;
  return v;
}

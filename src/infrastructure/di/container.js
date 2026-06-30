// Composition root.
// Builds the dependency graph once and exports a frozen container.
// Presentation controllers consume the container; nothing else wires
// dependencies directly. This is the ONLY place that knows about
// concrete infrastructure classes.

import { ChromeStorageClient } from "../persistence/chromeStorage/ChromeStorageClient.js";
import { ChromeBookmarkRepository } from "../persistence/chromeStorage/ChromeBookmarkRepository.js";
import { ChromeCategoryRepository } from "../persistence/chromeStorage/ChromeCategoryRepository.js";
import { ChromeSettingsRepository } from "../persistence/chromeStorage/ChromeSettingsRepository.js";
import { ChromeTaskRepository } from "../persistence/chromeStorage/ChromeTaskRepository.js";
import { ChromeLayoutRepository } from "../persistence/chromeStorage/ChromeLayoutRepository.js";
import { SystemClock } from "../services/SystemClock.js";
import { UuidGenerator } from "../services/UuidGenerator.js";
import { BasicSanitizer } from "../security/BasicSanitizer.js";

import { EventBus } from "../../application/ports/EventBus.js";

import { ListBookmarksUseCase } from "../../application/useCases/bookmarks/ListBookmarksUseCase.js";
import { CreateBookmarkUseCase } from "../../application/useCases/bookmarks/CreateBookmarkUseCase.js";
import { UpdateBookmarkUseCase } from "../../application/useCases/bookmarks/UpdateBookmarkUseCase.js";
import { DeleteBookmarkUseCase } from "../../application/useCases/bookmarks/DeleteBookmarkUseCase.js";

import { ListCategoriesUseCase } from "../../application/useCases/categories/ListCategoriesUseCase.js";
import { CreateCategoryUseCase } from "../../application/useCases/categories/CreateCategoryUseCase.js";
import { RenameCategoryUseCase } from "../../application/useCases/categories/RenameCategoryUseCase.js";
import { DeleteCategoryUseCase } from "../../application/useCases/categories/DeleteCategoryUseCase.js";
import { ReorderCategoriesUseCase } from "../../application/useCases/categories/ReorderCategoriesUseCase.js";
import { ReorderBookmarksUseCase } from "../../application/useCases/bookmarks/ReorderBookmarksUseCase.js";

import { GetSettingsUseCase } from "../../application/useCases/settings/GetSettingsUseCase.js";
import { UpdateUserNameUseCase } from "../../application/useCases/settings/UpdateUserNameUseCase.js";
import { UpdateTimeFormatUseCase } from "../../application/useCases/settings/UpdateTimeFormatUseCase.js";
import { UpdateBackgroundAppearanceUseCase } from "../../application/useCases/settings/UpdateBackgroundAppearanceUseCase.js";
import { SaveUserSettingsUseCase } from "../../application/useCases/settings/SaveUserSettingsUseCase.js";
import { HttpWeatherService } from "../services/HttpWeatherService.js";
import { GetWeatherUseCase } from "../../application/useCases/weather/GetWeatherUseCase.js";
import { UpdateDailyFocusUseCase } from "../../application/useCases/settings/UpdateDailyFocusUseCase.js";

import { UpdateBackgroundUseCase } from "../../application/useCases/background/UpdateBackgroundUseCase.js";
import { BuildGreetingUseCase } from "../../application/useCases/background/BuildGreetingUseCase.js";
import { GetCurrentTimeUseCase } from "../../application/useCases/background/GetCurrentTimeUseCase.js";

import { ListTasksUseCase } from "../../application/useCases/tasks/ListTasksUseCase.js";
import { CreateTaskUseCase } from "../../application/useCases/tasks/CreateTaskUseCase.js";
import { UpdateTaskUseCase } from "../../application/useCases/tasks/UpdateTaskUseCase.js";
import { DeleteTaskUseCase } from "../../application/useCases/tasks/DeleteTaskUseCase.js";
import { ReorderTasksUseCase } from "../../application/useCases/tasks/ReorderTasksUseCase.js";

import { GetLayoutUseCase } from "../../application/useCases/layout/GetLayoutUseCase.js";
import { MoveWidgetUseCase } from "../../application/useCases/layout/MoveWidgetUseCase.js";
import { ResizeWidgetUseCase } from "../../application/useCases/layout/ResizeWidgetUseCase.js";
import { ToggleWidgetVisibilityUseCase } from "../../application/useCases/layout/ToggleWidgetVisibilityUseCase.js";



export function buildContainer() {
  // ---- infrastructure singletons ----
  const storage = new ChromeStorageClient();
  const bookmarkRepo = new ChromeBookmarkRepository(storage);
  const categoryRepo = new ChromeCategoryRepository(storage);
  const settingsRepo = new ChromeSettingsRepository(storage);
  const taskRepo = new ChromeTaskRepository(storage);
  const layoutRepo = new ChromeLayoutRepository(storage);
  const clock = new SystemClock();
  const ids = new UuidGenerator();
  const sanitizer = new BasicSanitizer();
  const events = new EventBus();
  const weatherService = new HttpWeatherService();

  // ---- repositories that can be wiped when another tab changes state ----
  storage.onChanged((changes) => {
    if (changes.bookmarks) bookmarkRepo.invalidate();
    if (changes.categories) categoryRepo.invalidate();
    if (changes.settings) settingsRepo.invalidate();
    if (changes.tasks) taskRepo.invalidate();
    if (changes.layout) layoutRepo.invalidate();

    if (changes.bookmarks) events.emit("bookmarks:changed", undefined);
    if (changes.categories) events.emit("categories:changed", undefined);
    if (changes.settings) events.emit("settings:changed", undefined);
    if (changes.tasks) events.emit("tasks:changed", undefined);
    if (changes.layout) events.emit("layout:changed", undefined);
  });



  // ---- use cases ----
  const useCases = Object.freeze({
    listBookmarks: new ListBookmarksUseCase(bookmarkRepo),
    createBookmark: new CreateBookmarkUseCase({
      bookmarkRepo,
      categoryRepo,
      ids,
      sanitizer,
      events,
    }),
    updateBookmark: new UpdateBookmarkUseCase({
      bookmarkRepo,
      sanitizer,
      events,
    }),
    deleteBookmark: new DeleteBookmarkUseCase({ bookmarkRepo, events }),
    reorderBookmarks: new ReorderBookmarksUseCase({ repo: bookmarkRepo, events }),

    listCategories: new ListCategoriesUseCase(categoryRepo),
    createCategory: new CreateCategoryUseCase({
      categoryRepo,
      bookmarkRepo,
      ids,
      sanitizer,
      events,
    }),
    renameCategory: new RenameCategoryUseCase({
      categoryRepo,
      sanitizer,
      events,
    }),
    deleteCategory: new DeleteCategoryUseCase({
      categoryRepo,
      bookmarkRepo,
      events,
    }),
    reorderCategories: new ReorderCategoriesUseCase({ repo: categoryRepo, events }),

    getSettings: new GetSettingsUseCase(settingsRepo),
    updateUserName: new UpdateUserNameUseCase({
      settingsRepo,
      sanitizer,
      events,
    }),
    updateTimeFormat: new UpdateTimeFormatUseCase({ settingsRepo, events }),
    updateBackgroundAppearance: new UpdateBackgroundAppearanceUseCase({
      settingsRepo,
      events,
    }),
    saveUserSettings: new SaveUserSettingsUseCase({
      settingsRepo,
      events,
    }),
    getWeather: new GetWeatherUseCase(weatherService),
    updateDailyFocus: new UpdateDailyFocusUseCase({ settingsRepo, events }),

    updateBackground: new UpdateBackgroundUseCase({ settingsRepo, events }),
    buildGreeting: new BuildGreetingUseCase({ settingsRepo, clock }),
    getCurrentTime: new GetCurrentTimeUseCase(clock),

    listTasks: new ListTasksUseCase(taskRepo),
    createTask: new CreateTaskUseCase({ repo: taskRepo, ids, sanitizer, events }),
    updateTask: new UpdateTaskUseCase({ taskRepo, sanitizer, events }),
    deleteTask: new DeleteTaskUseCase({ taskRepo, events }),
    reorderTasks: new ReorderTasksUseCase({ taskRepo, events }),

    getLayout: new GetLayoutUseCase(layoutRepo),
    moveWidget: new MoveWidgetUseCase({ layoutRepo, events }),
    resizeWidget: new ResizeWidgetUseCase({ layoutRepo, events }),
    toggleWidgetVisibility: new ToggleWidgetVisibilityUseCase({
      layoutRepo,
      events,
    }),


  });

  return Object.freeze({
    events,
    useCases,
    // exposed for tests; presentation code never touches these
    internals: {
      storage,
      bookmarkRepo,
      categoryRepo,
      settingsRepo,
      taskRepo,
      layoutRepo,
      clock,
      ids,
      sanitizer,
    },
  });
}

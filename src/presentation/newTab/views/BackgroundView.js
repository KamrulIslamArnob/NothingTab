import { BasicSanitizer } from "../../../infrastructure/security/BasicSanitizer.js";
import { BackgroundKind } from "../../../domain/valueObjects/BackgroundConfig.js";

/**
 * Applies the user background to <body>::before (image/color/gradient)
 * and the overlay+blur to <body>::after.
 *
 * The pseudo-elements are defined in shared/styles/base.css.
 */
export class BackgroundView {
  /** @param {{ settings: any, sanitizer: BasicSanitizer }} deps */
  constructor({ settings, sanitizer }) {
    this.settings = settings;
    this.sanitizer = sanitizer;
    this.objectUrl = "";
    this.objectUrlSource = "";
  }

  /** @param {import('../../../domain/entities/UserSettings.js').UserSettings} settings */
  update(settings) {
    const bg = settings.background;
    const blur = settings.backgroundBlur;
    const overlay = settings.backgroundOverlay;
    const tintColor = settings.backgroundTintColor || "#000000";
    const buttonRoundness = settings.buttonRoundness ?? 8;
    const themePreset = settings.themePreset;

    if (themePreset !== undefined) {
      document.documentElement.setAttribute("data-theme", themePreset || "minimal");
    }

    const style = document.body.style;
    const rootStyle = document.documentElement.style;
    const setVar = (name, value) => {
      style.setProperty(name, value);
      rootStyle.setProperty(name, value);
    };
    setVar("--bg-blur", `${blur}px`);
    setVar("--bg-scale", blur > 0 ? "1.04" : "1");
    setVar("--bg-overlay", `${overlay}`);
    setVar("--bg-overlay-color", tintColor);
    setVar("--bg-solid", "transparent");
    setVar("--button-radius", `${buttonRoundness}px`);
    
    // New Filters
    setVar("--bg-grayscale", `${settings.bgGrayscale || 0}%`);
    setVar("--bg-hue", `${settings.bgHueRotate || 0}deg`);

    // Ensure we reset pixelation bounds since we removed the feature
    setVar("--bg-pixel-right", "0");
    setVar("--bg-pixel-bottom", "0");
    setVar("--bg-pixel-width", "100%");
    setVar("--bg-pixel-height", "100%");
    setVar("--bg-pixel-scale", "1");
    setVar("--bg-image-rendering", "auto");

    // Vignette and Film Grain (Effects Layer)
    let effectsLayer = document.getElementById("bg-effects-layer");
    if (!effectsLayer) {
      effectsLayer = document.createElement("div");
      effectsLayer.id = "bg-effects-layer";
      effectsLayer.style.cssText = "position: fixed; inset: 0; pointer-events: none; z-index: 2;";
      document.body.insertBefore(effectsLayer, document.body.firstChild);
    }
    let effectsBg = [];
    if (settings.bgVignette) {
      effectsBg.push("radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.85) 100%)");
    }
    // Film grain removed as per user request
    effectsLayer.style.backgroundImage = effectsBg.length > 0 ? effectsBg.join(", ") : "none";

    switch (bg.kind) {
      case BackgroundKind.LOCAL_IMAGE: {
        const val = bg.value || "";
        let image;
        if (val.startsWith("data:")) {
          image = `url("${this.objectUrlFor(val)}")`;
        } else {
          this.clearObjectUrl();
          const safeName = this.sanitizer.text(val);
          image = `url("img/${safeName}")`;
        }
        setVar("--bg-image", image);
        setVar("--bg-solid", "transparent");
        style.backgroundImage = "none";
        style.backgroundColor = "transparent";
        setVar("--bg-size", "cover");
        setVar("--bg-position", "center");
        break;
      }
      case BackgroundKind.REMOTE_IMAGE: {
        this.clearObjectUrl();
        const safeUrl = this.sanitizer.url(bg.value || "");
        const image = safeUrl ? `url("${safeUrl}")` : "none";
        setVar("--bg-image", image);
        setVar("--bg-solid", "transparent");
        style.backgroundImage = "none";
        style.backgroundColor = "transparent";
        if (safeUrl) {
          setVar("--bg-image", image);
        } else {
          setVar("--bg-image", "none");
        }
        setVar("--bg-size", "cover");
        setVar("--bg-position", "center");
        break;
      }
      case BackgroundKind.SOLID_COLOR: {
        this.clearObjectUrl();
        const safe = this.sanitizer.text(bg.value || "#1f2937");
        setVar("--bg-image", "none");
        setVar("--bg-solid", safe);
        style.backgroundImage = "none";
        style.backgroundColor = safe;
        break;
      }
      case BackgroundKind.GRADIENT: {
        this.clearObjectUrl();
        // bg.value is a serialized gradient: "linear-gradient(...)" etc.
        const safe = this.sanitizer.text(bg.value || "");
        setVar("--bg-image", safe || "none");
        setVar("--bg-solid", "transparent");
        style.backgroundImage = "none";
        style.backgroundColor = "transparent";
        setVar("--bg-size", "auto");
        setVar("--bg-position", "center");
        break;
      }
      default:
        this.clearObjectUrl();
        setVar("--bg-image", "none");
    }
  }

  objectUrlFor(dataUrl) {
    if (this.objectUrl && this.objectUrlSource === dataUrl) return this.objectUrl;
    this.clearObjectUrl();
    const [header, payload] = dataUrl.split(",");
    const mime = header.match(/^data:([^;]+)/)?.[1] || "image/png";
    const binary = atob(payload || "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    this.objectUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    this.objectUrlSource = dataUrl;
    return this.objectUrl;
  }

  clearObjectUrl() {
    if (!this.objectUrl) return;
    URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = "";
    this.objectUrlSource = "";
  }
}

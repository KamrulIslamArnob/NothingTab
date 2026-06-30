import { el } from "../../shared/dom.js";

export class GreetingView {
  constructor({ useCases, clock }) {
    this.useCases = useCases;
    this.clock = clock;
  }

  render(settings) {
    this.root = el("div", { className: "greeting-root center-aligned" });
    this.update(this.root, settings);
    return this.root;
  }

  buildText(settings) {
    const name = settings.name?.trim();
    const dot = el("span", { className: "badge-dot", "aria-hidden": "true" });

    if (!name) return [dot, el("span", {}, this.partOfDay())];
    
    const nameSpan = el("span", { className: "name" }, name);
    return [
      dot,
      el("span", {}, this.partOfDay() + ", ", nameSpan)
    ];
  }

  partOfDay() {
    const hour = this.clock.now().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }

  update(node, settings) {
    const children = this.buildText(settings);
    const elements = [el("h2", { className: "greeting-text" }, ...children)];
    
    if (settings.messageText?.trim()) {
      elements.push(el("div", { className: "quotes-widget", style: "margin-top: 8px;" }, settings.messageText.trim()));
    } else {
      elements.push(el("div", { className: "quotes-widget", style: "margin-top: 8px;" }, "Stay focused. Build. Ship. Repeat."));
    }
    
    node.replaceChildren(...elements);
  }
}

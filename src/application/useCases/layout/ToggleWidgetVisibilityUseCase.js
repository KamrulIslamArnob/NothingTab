import { Id } from "../../../domain/valueObjects/Id.js";

import { BaseWidgetUseCase } from "../shared/BaseWidgetUseCase.js";

export class ToggleWidgetVisibilityUseCase extends BaseWidgetUseCase {
  constructor(deps) {
    super(deps);
  }

  async execute({ id, visible }) {
    return this._modifyWidget(id, (widget) => {
      widget.setVisible(visible);
    });
  }
}
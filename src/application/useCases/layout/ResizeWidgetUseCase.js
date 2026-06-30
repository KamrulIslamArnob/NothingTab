import { Id } from "../../../domain/valueObjects/Id.js";

import { BaseWidgetUseCase } from "../shared/BaseWidgetUseCase.js";

export class ResizeWidgetUseCase extends BaseWidgetUseCase {
  constructor(deps) {
    super(deps);
  }

  async execute({ id, w, h }) {
    return this._modifyWidget(id, (widget) => {
      widget.resizeTo(w, h);
    });
  }
}
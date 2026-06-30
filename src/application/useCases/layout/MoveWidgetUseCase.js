import { Id } from "../../../domain/valueObjects/Id.js";

import { BaseWidgetUseCase } from "../shared/BaseWidgetUseCase.js";

export class MoveWidgetUseCase extends BaseWidgetUseCase {
  constructor(deps) {
    super(deps);
  }

  async execute({ id, x, y }) {
    return this._modifyWidget(id, (widget) => {
      widget.moveTo(x, y);
    });
  }
}
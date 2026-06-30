export class GetCurrentTimeUseCase {
  #clock;

  constructor(clock) {
    this.#clock = clock;
  }

  execute() {
    return this.#clock.now();
  }
}
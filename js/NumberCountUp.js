import { CountUp } from '../vendor/countup/countUp.js';

class NumberCountUp {
  constructor(domId) {
    this.domId = domId;
    this.counter = null;
    this.options = {
      suffix: ' €',
      decimalPlaces: 2,
    };
  }

  update(num) {
    if (!this.counter) {
      console.error("counter not yet setup!");
      return;
    }
    this.counter.update(num);
  }

  setup() {
    this.counter = new CountUp(this.domId, 0, this.options);
    if (!this.counter.error) {
      this.counter.start();
    }
  }
}

export default NumberCountUp;
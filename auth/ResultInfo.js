const _ = require("lodash");

class ResultInfo {
  result = null;

  parentStack = [];

  constructor(result) {
    this.result = result;
  }

  getValue() {
    if (!this.parentStack.length) {
      // TODO: _.cloneDeep ??? everywhere ???
      return this.result;
    }
    return _.get(this.result, this.parentStack);
  }

  getKey() {
    return _.last(this.parentStack);
  }

  getParentValue() {
    if (this.parentStack.length === 0) {
      return null;
    }
    if (this.parentStack.length === 1) {
      return this.result;
    }
    return _.get(this.result, _.initial(this.parentStack));
  }

  enter(path) {
    this.parentStack.push(path);
  }

  leave() {
    this.parentStack.pop();
  }
}

module.exports = {
  ResultInfo,
};

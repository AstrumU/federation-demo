const graphql = require("graphql");
const _ = require("lodash");

const { ResultInfo } = require("./ResultInfo");

function getDeepType(type) {
  if (type.ofType) {
    return getDeepType(type.ofType);
  }
  return type;
}

function executeRules(
  resultInfo,
  typeInfo,
  requestContext,
  validationsByType,
  validationsByField
) {
  const type = getDeepType(typeInfo.getType());
  const parentType = getDeepType(typeInfo.getParentType());
  const typeName = type.name;
  const parentTypeName = parentType.name;

  if (typeName in validationsByType) {
    validationsByType[typeName](
      resultInfo.getValue(),
      resultInfo.getParentValue(),
      requestContext
    );
  }

  if (parentTypeName in validationsByField) {
    const key = resultInfo.getKey();
    if (key in validationsByField[parentTypeName]) {
      validationsByField[parentTypeName][key](
        resultInfo.getValue(),
        resultInfo.getParentValue(),
        requestContext
      );
    }
  }
}

function getRulesExecutor(requestContext, rules) {
  return function (resultInfo, typeInfo) {
    return executeRules(
      resultInfo,
      typeInfo,
      requestContext,
      rules.validation.validationsByType,
      rules.validation.validationsByField
    );
  };
}

function visitWithResultInfoAndExecuteRules(
  resultInfo,
  typeInfo,
  ruleExecutor
) {
  const resultInfoList = [resultInfo];
  // TODO: check null in result in some field
  return {
    enter(node) {
      switch (node.kind) {
        case "Field":
          // TODO: check NonNull type (NonNull(ofType: List))
          if (graphql.isListType(typeInfo.getType())) {
            resultInfoList.map((resultInfo) => {
              // TODO: use enter from else (do enter always and then do if(isList))???
              resultInfo.enter(node.name.value);
              const list = resultInfo.getValue();
              list.map((value, index) => {
                if (index === 0) {
                  resultInfo.enter(index);
                } else {
                  const newResultInfo = new ResultInfo(list);
                  newResultInfo.enter(index);
                  resultInfoList.push(newResultInfo);
                }
              });
            });
          } else {
            resultInfoList.map((resultInfo) =>
              resultInfo.enter(node.name.value)
            );
          }

          resultInfoList.map((resultInfo) =>
            ruleExecutor(resultInfo, typeInfo)
          );

          // TODO: return false if value is null to stop visiting current branch
          // exception is arrays where in some item branch can be null, but not in other items

          break;
      }
    },
    leave(node) {
      switch (node.kind) {
        case "Field":
          resultInfoList.map((resultInfo) => {
            if (graphql.isListType(typeInfo.getType())) {
              // additional leave() from array index
              resultInfo.leave();
            }
            const resultInfoParentValue = resultInfo.getParentValue();
            if (resultInfoParentValue) {
              resultInfo.leave();
            } else {
              _.remove(resultInfoList, (item) => item === resultInfo);
            }
          });
          break;
      }
    },
  };
}

module.exports = {
  getRulesExecutor,
  visitWithResultInfoAndExecuteRules,
};

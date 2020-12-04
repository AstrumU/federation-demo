const graphql = require("graphql");

const { getVisitor } = require("./visitSelectionSet");
const { ResultInfo } = require("./ResultInfo");
const {
  visitWithResultInfoAndExecuteRules,
  getRulesExecutor,
} = require("./ruleExecutor");

function getApolloPlugin(rules) {
  return {
    requestDidStart(requestContext) {
      const typeInfo = new graphql.TypeInfo(requestContext.schema);
      const typeInfoVisitor = graphql.visitWithTypeInfo(typeInfo, {
        SelectionSet: getVisitor(typeInfo, rules),
      });
      const ast = graphql.parse(requestContext.request.query);
      // by default, definitions contains all queries/mutations of the document
      // for example of playground
      const filteredDefinitions = ast.definitions.filter((definition) => {
        // TODO: there can be anonymous definitions without name
        return definition.name.value === requestContext.request.operationName;
      });
      ast.definitions = filteredDefinitions;

      const visited = graphql.visit(ast, typeInfoVisitor);
      const visitedAst = graphql.print(visited);
      requestContext.request.query = visitedAst;

      return {
        async didResolveOperation(requestContext) {
          console.log("didResolveOperation");
          if (
            requestContext.operation.operation in
            rules.validation.validationsByOperation
          ) {
            await Promise.all(
              requestContext.operation.selectionSet.selections.map(
                async (selection) => {
                  if (
                    selection.name.value in
                    rules.validation.validationsByOperation[
                      requestContext.operation.operation
                    ]
                  ) {
                    await rules.validation.validationsByOperation[
                      requestContext.operation.operation
                    ][selection.name.value](requestContext);
                  }
                }
              )
            );
          }
        },
        willSendResponse(requestContext) {
          if (requestContext.response.data) {
            const typeInfo = new graphql.TypeInfo(requestContext.schema);
            const resultInfo = new ResultInfo(requestContext.response.data);
            const typeInfoVisitor = graphql.visitWithTypeInfo(
              typeInfo,
              visitWithResultInfoAndExecuteRules(
                resultInfo,
                typeInfo,
                getRulesExecutor(requestContext, rules)
              )
            );
            const ast = graphql.parse(requestContext.request.query);
            const visited = graphql.visit(ast, typeInfoVisitor);
            // TODO: remove fields that user didn't query but we added them to info as auth rule requirement
          }
        },
      };
    },
  };
}

module.exports = {
  getApolloPlugin,
};

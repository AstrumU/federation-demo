const graphql = require("graphql");

// copied from graphql-tools
function memoize2(fn) {
  let cache1;
  function memoized(a1, a2) {
    if (!cache1) {
      cache1 = new WeakMap();
      const cache2 = new WeakMap();
      cache1.set(a1, cache2);
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    let cache2 = cache1.get(a1);
    if (!cache2) {
      cache2 = new WeakMap();
      cache1.set(a1, cache2);
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    const cachedValue = cache2.get(a2);
    if (cachedValue === undefined) {
      const newValue = fn(a1, a2);
      cache2.set(a2, newValue);
      return newValue;
    }
    return cachedValue;
  }
  return memoized;
}

// copied from graphql-tools
const addSelectionsToMap = memoize2(function (map, selectionSet) {
  selectionSet.selections.forEach((selection) => {
    map.set(graphql.print(selection), selection);
  });
});

// copied from graphql-tools
function visitSelectionSet(
  node,
  typeInfo,
  selectionSetsByType,
  selectionSetsByField,
  dynamicSelectionSetsByField
) {
  const parentType = typeInfo.getParentType();
  const newSelections = new Map();
  if (parentType != null) {
    const parentTypeName = parentType.name;
    addSelectionsToMap(newSelections, node);
    if (parentTypeName in selectionSetsByType) {
      const selectionSet = selectionSetsByType[parentTypeName];
      addSelectionsToMap(newSelections, selectionSet);
    }
    if (parentTypeName in selectionSetsByField) {
      node.selections.forEach((selection) => {
        if (selection.kind === graphql.Kind.FIELD) {
          const name = selection.name.value;
          const selectionSet = selectionSetsByField[parentTypeName][name];
          if (selectionSet != null) {
            addSelectionsToMap(newSelections, selectionSet);
          }
        }
      });
    }
    if (parentTypeName in dynamicSelectionSetsByField) {
      node.selections.forEach((selection) => {
        if (selection.kind === graphql.Kind.FIELD) {
          const name = selection.name.value;
          const dynamicSelectionSets =
            dynamicSelectionSetsByField[parentTypeName][name];
          if (dynamicSelectionSets != null) {
            dynamicSelectionSets.forEach((selectionSetFn) => {
              const selectionSet = selectionSetFn(selection);
              if (selectionSet != null) {
                addSelectionsToMap(newSelections, selectionSet);
              }
            });
          }
        }
      });
    }
    return {
      ...node,
      selections: Array.from(newSelections.values()),
    };
  }
}

function getVisitor(typeInfo, rules) {
  function visitor(node) {
    return visitSelectionSet(
      node,
      typeInfo,
      rules.selectionSet.selectionSetsByType,
      rules.selectionSet.selectionSetsByField,
      {}
    );
  }
  return visitor;
}

module.exports = {
  getVisitor,
};

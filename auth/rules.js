const rules = {
  selectionSet: {
    selectionSetsByType: {
      User: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            name: {
              kind: "Name",
              value: "username",
            },
          },
        ],
      },
      Review: {
        kind: "SelectionSer",
        selections: [
          {
            kind: "Field",
            name: {
              kind: "Name",
              value: "body",
            },
          },
        ],
      },
    },
    selectionSetsByField: {
      User: {
        testField: {
          kind: "SelectionSet",
          selections: [
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "name",
              },
            },
          ],
        },
        name: {
          kind: "SelectionSet",
          selections: [
            {
              kind: "Field",
              name: {
                kind: "Name",
                value: "testField",
              },
            },
          ],
        },
      },
    },
  },
  validation: {
    validationsByOperation: {
      query: {
        me: async (requestContext) => {
          console.log("validationsByOperation::query::me");
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              console.log("validationsByOperation::query::me::TimeoutResolved");
              resolve();
            }, 5000);
          });
          // throw new Error("Unauthorized");
        },
      },
      mutation: {
        updateUser: (requestContext) => {
          console.log(
            "validationsByOperation::mutation::updateUser",
            requestContext
          );
        },
        updateReview: async (requestContext) => {
          console.log(
            "validationsByOperation::mutation::updateReview",
            requestContext
          );
          const reviewId = requestContext.operation.selectionSet.selections[0].arguments.find(
            (arg) => arg.name.value === "id"
          ).value.value;
          const review = await new Promise((resolve, reject) => {
            setTimeout(() => {
              resolve({
                id: "1",
                authorID: "2",
                product: { upc: "1" },
                body: "Love it!",
              });
            }, 5000);
          });

          if (review.authorID !== requestContext.context.user.id) {
            throw new Error("Unauthorized!");
          }
        },
      },
    },
    validationsByType: {
      User: (value, parentValue, requestContext) => {
        console.log("validationsByType::User" /* , value, parentValue */);
      },
      Review: (value, parentValue, requestContext) => {
        console.log("validationsByType::Review" /* , value, parentValue */);
      },
    },
    validationsByField: {
      User: {
        testField: (value, parentValue, requestContext) => {
          console.log(
            "validationsByField::User::testField",
            value,
            parentValue
          );
        },
      },
      Review: {
        body: (value, parentValue, requestContext) => {
          console.log("validationsByField::Review::body", value, parentValue);
        },
      },
    },
  },
};

module.exports = {
  rules,
};

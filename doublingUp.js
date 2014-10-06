var expressions = require('./expressions');
// makeAtom(sign, varNum) {
// makeExpression(a, b, c) {
// makeValuation(i, numVars) {
// makeBehavior(i, numVars) {
// evaluateFor(expression, vals) {
// evaluate(expression, numVars) {
// insertVar(varNum, expression) {
// expressionSize(expression) {
// expressionToHuman(expression) {
// printResult(result, numVar) {

var ALLOW_VARS_AS_ATOMS = true;

function getBootstrap(numVars, previousResult) {
  var result = {}, leftBehavior, rightBehavior, varNum;
  function propose(behavior, expression) {
    if (typeof result[behavior] === 'undefined'
        || expressions.expressionSize(result[behavior]) > expressions.expressionSize(expression)) {
      result[behavior] = expression;
    }
  }

  if (ALLOW_VARS_AS_ATOMS && numVars === 1) {
    result[expressions.evaluate(expressions.makeAtom(true, 0), 1)] = expressions.makeAtom(true, 0);
    result[expressions.evaluate(expressions.makeAtom(false, 0), 1)] = expressions.makeAtom(false, 0);
  }

  for (varNum = 0; varNum < numVars; varNum++) {
    for (leftBehavior in previousResult) {
      for (rightBehavior in previousResult) {
        if (leftBehavior === rightBehavior) {
          propose(expressions.mergeBehaviors(varNum, numVars, leftBehavior, rightBehavior),
              expressions.insertVar(varNum, previousResult[leftBehavior]));
        } else {
          propose(expressions.mergeBehaviors(varNum, numVars, leftBehavior, rightBehavior),
              [expressions.makeAtom(true, 0),
               expressions.insertVar(varNum, previousResult[rightBehavior]),
               expressions.insertVar(varNum, previousResult[leftBehavior])
              ]);
        }
      }
    }
  }
  return result;
}


var previousResult = {};
previousResult[expressions.evaluate(expressions.makeAtom(false), 0)] = expressions.makeAtom(false);
previousResult[expressions.evaluate(expressions.makeAtom(true), 0)] = expressions.makeAtom(true);

expressions.printResult(previousResult, 0);
previousResult = expressions.printResult(getBootstrap(1, previousResult), 1);
previousResult = expressions.printResult(getBootstrap(2, previousResult), 2);
previousResult = expressions.printResult(getBootstrap(3, previousResult), 3);
previousResult = expressions.printResult(getBootstrap(4, previousResult), 4);

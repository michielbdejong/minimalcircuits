//datastructures:
//atom: integer sign * (varNum+2) or 1/0 for true/false
//expression: array of 3 expressions, or atom
//valuation: string of 0's and 1's

function makeAtom(sign, varNum) {
  if (typeof varNum === 'number') {
    return (sign?1:-1) * (varNum+2);
  }
  return (sign? 1 : -1);
}

function makeExpression(a, b, c) {
  return [a, b, c];
}

function makeValuation(i, numVars) {
  var str = i.toString(2);
  while (str.length < numVars) {
    str = '0' + str;
  }
  return str;
}

function makeBehavior(i, numVars) {
  var str = i.toString(2);
  while (str.length < Math.pow(2, numVars)) {
    str = '0' + str;
  }
  return str;
}

function evaluateFor(expression, vals) {
  if (Array.isArray(expression)) {
    if (evaluateFor(expression[0], vals)) {
      return evaluateFor(expression[1], vals);
    } else {
      return evaluateFor(expression[2], vals);
    }
  } else if (expression === 1) {
    return true;
  } else if (expression === -1) {
    return false;
  } else if (expression > 0) {
    return (vals[expression-2] === '1');
  } else {
    return (vals[-(expression+2)] === '0');
  }
}
function evaluate(expression, numVars) {
  var str = '';
  for (var i=0; i<Math.pow(2, numVars); i++) {
    str += (evaluateFor(expression, makeValuation(i, numVars)) ? '1' : '0');
  }
  return str;
}
function insertVar(varNum, expression) {
  if (Array.isArray(expression)) {
    return [
      insertVar(varNum, expression[0]),
      insertVar(varNum, expression[1]),
      insertVar(varNum, expression[2])
    ];
  } else if (expression >= varNum+2) {
    return expression+1;
  } else if (expression <= -varNum-2) {
    return expression-1;
  } else {
    return expression;
  }
}

function expressionSize(expression) {
  if (Array.isArray(expression)) {
    return expressionSize(expression[0])
        + expressionSize(expression[1])
        + expressionSize(expression[2])
        + 1;
  } else {
    return 0;
  }
}
 
function branchOnVar(previousResults, results, varNum, numVars, maxNodes) {
  var i, j, thisExpression, thisEvaluation;
  for (i in previousResults) {
    for (j in previousResults) {
      if ((i != j) && (expressionSize(previousResults[i]) + expressionSize(previousResults[j]) < maxNodes)) {
        thisExpression = [
          varNum + 2,
          insertVar(varNum, previousResults[i]),
          insertVar(varNum, previousResults[j])
        ];
        thisEvaluation = evaluate(thisExpression, numVars);
        if (!results[thisEvaluation]) {
          results[thisEvaluation] = thisExpression;
        }
      }
    }
  }
  return results;
}
function addAtoms(numVars) {
  var results = {};
  for (i=1; i<numVars+2; i++) {
    results[evaluate(i, numVars)] = i;
    results[evaluate(-i, numVars)] = -i;
  }
  return results;
}
function done(results, numVar, maxNodes) {
  var i, val;
  for (i=0; i<Math.pow(2, Math.pow(2, numVar)); i++) {
    val = makeBehavior(i, numVar);
    if (typeof results[val] === 'undefined') {
      console.log('not done', val, maxNodes);
      return false;
    }
  }
  return true;
}
function calcFor(numVars, previousResults) {
  var results = addAtoms(numVars);
  var maxNodes=1;
  while (!done(results, numVars, maxNodes)) {
    for (var branchVar=0; branchVar<numVars; branchVar++) {
      results = branchOnVar(previousResults, results, branchVar, numVars, maxNodes);
    }
    maxNodes++;
  }
  return results;
}

function expressionToHuman(expression) {
  
  if (Array.isArray(expression)) {
    return 'if ('
        + expressionToHuman(expression[0]) + ') then ('
        + expressionToHuman(expression[1]) + ') else ('
        + expressionToHuman(expression[2]) + ')';
  } else if (typeof expression === 'undefined') {
    return 'undefined';
  } else {
    return {
      '-8': 'g\'',
      '-7': 'f\'',
      '-6': 'e\'',
      '-5': 'd\'',
      '-4': 'c\'',
      '-3': 'b\'',
      '-2': 'a\'',
      '-1': 'false',
      '1': 'true',
      '2': 'a',
      '3': 'b',
      '4': 'c',
      '5': 'd',
      '6': 'e',
      '7': 'f',
      '8': 'g'
    }[expression.toString()];
  }
}
//1 var, 2 valuations, 4 behaviors
//2 vars, 4 valuations, 16 behaviors
//etc
function printResults(results, numVar) {
  var i, val;
  for (i=0; i<Math.pow(2, Math.pow(2, numVar)); i++) {
    val = makeBehavior(i, numVar);
    console.log(val + ': '+expressionToHuman(results[val]));
  }
}
var results = {};
results = calcFor(0, results); printResults(results, 0);
results = calcFor(1, results); printResults(results, 1);
results = calcFor(2, results); printResults(results, 2);
results = calcFor(3, results); printResults(results, 3);
results = calcFor(4, results); printResults(results, 4);

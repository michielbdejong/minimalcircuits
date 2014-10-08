var STATS_ONLY = true;
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
function printResult(result, numVar) {
  var i, val, sizes = {};
  if (STATS_ONLY) {
    console.log('Minimal sizes of expressions in ' + numVar + ' vars:');
  } else {
    console.log('Optimal Boolean expressions using only atoms and the if-then-else operator, in ' + numVar + ' variables:');
  }
  for (i=0; i<Math.pow(2, Math.pow(2, numVar)); i++) {
    val = makeBehavior(i, numVar);
    if (STATS_ONLY) {
      if (!sizes[expressionSize(result[val])]) {
        sizes[expressionSize(result[val])] = [];
      }
      sizes[expressionSize(result[val])].push(val);
    } else {
      console.log(val + ': '+expressionToHuman(result[val]));
    }
  }
  if (STATS_ONLY) {
    for (i in sizes) {
      console.log('' + i + '(' + sizes[i].length + '): '+ JSON.stringify(sizes[i]));
    }
  }
  return result;
}

function mergeBehaviors(varNum, numVar, leftBehavior, rightBehavior) {
// varNum = 0 -> LLLLLLLLRRRRRRRR chunkSize = Math.pow(2, 4-0-1) = 8
// varNum = 1 -> LLLLRRRRLLLLRRRR chunkSize = Math.pow(2, 4-1-1) = 4
// varNum = 2 -> LLRRLLRRLLRRLLRR chunkSize = Math.pow(2, 4-2-1) = 2
// varNum = 3 -> LRLRLRLRLRLRLRLR chunkSize = Math.pow(2, 4-3-1) = 1
// numVar = 4
  var chunkSize = Math.pow(2, numVar-varNum-1), merge = [],
    leftVals = leftBehavior.split(''),
    rightVals = rightBehavior.split('');
  while (leftVals.length) {
    //console.log('varNum, numVar, chunkSize, leftBehavior, rightBehavior, merge',
    //    JSON.stringify([varNum, numVar, chunkSize, leftVals, rightVals, merge]));
    merge = merge.concat(leftVals.splice(0, chunkSize));
    merge = merge.concat(rightVals.splice(0, chunkSize));
  }
  return merge.join('');
}

function splitBehavior(varNum, numVar, bigBehavior) {
  var chunkSize = Math.pow(2, numVar-varNum-1),
    leftVals = [], rightVals = [],
    bigVals = bigBehavior.split('');
  while (bigVals.length) {
    leftVals = leftVals.concat(bigVals.splice(0, chunkSize));
    rightVals = rightVals.concat(bigVals.splice(0, chunkSize));
  }
  return {
    left: leftVals.join(''),
    right: rightVals.join('')
  };
}
module.exports = {
  makeAtom         : makeAtom,
  makeExpression   : makeExpression,
  makeValuation    : makeValuation,
  makeBehavior     : makeBehavior,
  evaluateFor      : evaluateFor,
  evaluate         : evaluate,
  insertVar        : insertVar,
  expressionSize   : expressionSize,
  expressionToHuman: expressionToHuman,
  printResult      : printResult,
  mergeBehaviors   : mergeBehaviors,
  splitBehavior    : splitBehavior
};

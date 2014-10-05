var numVar = 1;
var expressions = {};
var iteration = 0;
var theseParams = [0, 0, 0];
var option;
var letter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

function genOptions(numVar) {
  option = [];
  option.push('0');
  option.push('1');
  for (var i=0; i<numVar; i++) {
    option.push(letter[i]+'\'');
    option.push(letter[i]);
  }
}

var optimal;

function zeroes(str, num) {
  while (str.length < num) {
    str = '0'+str;
  }
  return str;
}
function nextParam(numOptions, numPositions) {
  iteration++;
  theseParams = zeroes(iteration.toString(numOptions), numPositions).split('').map(function(str) {
    return parseInt(str);
  });
}

function printExpression(params) {
  if (Array.isArray(params)) {
    return '(if '+printExpression(params[0])
      +' then '+printExpression(params[1])
      +' else '+printExpression(params[2])
      +')';
  } else {
    return option[params];
  }
}
function calcAtomBehavior(atom, vals) {
  if (option[atom] === '0') {
    return '0';
  }
  if (option[atom] === '1') {
    return '1';
  }
  for (var i=0; i<letter.length; i++) {
    if (option[atom] === letter[i]+'\'') {
      return (vals[i]?'0':'1');
    }
    if (option[atom] === letter[i]) {
      return (vals[i]?'1':'0');
    }
  }
  throw new Error('unknown option, atom:' + JSON.stringify(atom) + ', vals:' + JSON.stringify(vals));
}
function printAtomBehavior(atom, numVars) {
  var str = '', vals;
  for (var i=0; i<Math.pow(2, numVars); i++) {
    vals = i.toString(2).split('').map(function(str) {
      return (str === '1');
    });
    str += calcAtomBehavior(atom, vals);
  }
  return str;
}
function getVals(numVars) {
  var chars, vals = [];
  for(var i=0; i<Math.pow(2, numVars); i++) {
    vals.push(zeroes(i.toString(2), numVars).split('').map(function(str) {
      return (str === '1');
    }));
  }
  return vals;
}
function getPattern(varNum, sign, numVars) {
  var pattern = [];
  //varNum/numVars 0/1 -> 01              1 1
  //varNum/numVars 0/2 -> 0011            1 2
  //varNum/numVars 1/2 -> 01 01           2 1
  //varNum/numVars 0/3 -> 00001111        1 4
  //varNum/numVars 1/3 -> 0011 0011       2 2
  //varNum/numVars 2/3 -> 01 01 01 01     3 1
  for (var i=0; i<varNum+1; i++) {
    for (var j=0; j<Math.pow(2, numVars-varNum); j++) {
      pattern.push(sign ? 1 : 0);
    }
    for (var j=0; j<Math.pow(2, numVars-varNum); j++) {
      pattern.push(sign ? 0 : 1);
    }
  }
  return pattern;
}
function printCondBehavior(params, numVars) {
  if (option[params[0]] === '0') {
    pattern = [];
    for (var i=0; i<Math.pow(2, numVars); i++) {
      pattern.push(0);
    }
  } else if (option[params[0]] === '1') {
    pattern = [];
    for (var i=0; i<Math.pow(2, numVars); i++) {
      pattern.push(1);
    }
  } else {
    for (var i=0; i<letter.length; i++) {
      if (option[params[0]] === letter[i]+'\'') {
        pattern = getPattern(i, false, numVars);
        break;
      } else if (option[params[0]] === letter[i]) {
        pattern = getPattern(i, true, numVars);
        break;
      }
    }
  }
  for (var i=0; i<pattern.length; i++) {
    if (pattern[i] === 0) {
      pattern[i] = 2;
    }
  }
  var vals = getVals(numVars);
  var str = '';
  for (var i=0; i<vals.length; i++) {
    str += calcAtomBehavior(params[pattern[i]], vals[i]);
  }
  return str;
}

function calcTwoNodes(numVars) {
  var numOptions = numVars*2+2;
  var numPositions = 5;
  var numTrees = 2; // [[a,b,c], d, e] and [a, [b,c,d], e]  - [a, b, [c,d,e]] is rotatable to [a, [c,d,e], b]
  var numCombinations = Math.pow(numOptions, numPositions);

  for (var i=0; i<numCombinations; i++) {
    if (!optimal[printCondBehavior(theseParams, numVars)]) {
      optimal[printCondBehavior(theseParams, numVars)] = printExpression(theseParams);
    }
    nextParam(numOptions, numPositions);
  }
}

function calcOneNode(numVars) {
  var numOptions = numVars*2+2;
  var numPositions = 3;
  var numCombinations = Math.pow(numOptions, numPositions);

  for (var i=0; i<numCombinations; i++) {
    if (!optimal[printCondBehavior(theseParams, numVars)]) {
      optimal[printCondBehavior(theseParams, numVars)] = printExpression(theseParams);
    }
    nextParam(numOptions, numPositions);
  }
}

function calcZeroNodes(numVars) {
  for (var i=0; i<option.length; i++) {
    if (!optimal[printAtomBehavior(i, numVars)]) {
      optimal[printAtomBehavior(i, numVars)] = option[i];
    }
  }
}

function printOutcome(numVars, optimal) {
  console.log('outcome for '+numVars+' vars:');
  for (var i=0; i<Math.pow(2, Math.pow(2, numVars)); i++) {
    var thisStr = zeroes(i.toString(2), Math.pow(2, numVars));
    console.log(thisStr+': '+optimal[thisStr]);
  }
}

//...
for (var numVars = 1; numVars <= 3; numVars++) {
  optimal = {};
  genOptions(numVars);
  calcZeroNodes(numVars);
  calcOneNode(numVars);
  calcTwoNodes(numVars);
  printOutcome(numVars, optimal);
}

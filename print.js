//for a bit of inline unit testing:
function assert(a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.log('assertion failed', a, b);
    die();
  }
}

//print an expression tree in a human-readable string format:
function printExpression(expression) {
  if (Array.isArray(expression)) {
    return '(if '+printExpression(expression[0])
      +' then '+printExpression(expression[1])
      +' else '+printExpression(expression[2])
      +')';
  } else {//atoms are readily human-readable:
    return expression;
  }
}

//print out the results:
function printOutcome(numVars, optimal, undefinedOnly) {
  var thisStr, somethingStillUndefined = false;
  console.log(
      (undefinedOnly?'undefined':'outcome')
      + ' for ' + numVars + ' vars:');
  for (var i=0; i<Math.pow(2, Math.pow(2, numVars)); i++) {
    thisStr = zeroes(i.toString(2), Math.pow(2, numVars));
    if (typeof optimal[thisStr] === 'undefined') {
      somethingStillUndefined = true;
    }
    if (!undefinedOnly || typeof optimal[thisStr] === 'undefined') {
      console.log(thisStr+': '+printExpression(optimal[thisStr]));
    }
  }
  return somethingStillUndefined;
}

//generate the n-th atom option:
function makeAtom(option) {
  var atoms = {
    0: '0', 1: '1',
    2: 'a\'', 3: 'a',
    4: 'b\'', 5: 'b',
    6: 'c\'', 7: 'c',
    8: 'd\'', 9: 'd'
  };
  return atoms[option];
}

//adds zeroes at the front of a string:
function zeroes(str, num) {
  while (str.length < num) {
    str = '0'+str;
  }
  return str;
}
assert(zeroes('abc', 0), 'abc');
assert(zeroes('abc', 10), '0000000abc');

module.exports.printOutcome = printOutcome;
module.exports.printExpression = printExpression;
module.exports.zeroes = zeroes;
module.exports.makeAtom = makeAtom;

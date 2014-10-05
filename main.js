var print = require('./print'),
  printOutcome = print.printOutcome,
  makeAtom = print.makeAtom,
  zeroes = print.zeroes,
  printExpression = print.printExpression;

//basic structures:
//- expression (string '0', '1', 'x\'', 'x' or array [expression, expression, expression])
//- valuation (array numVars booleans)

//for a bit of inline unit testing:
function assert(a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    console.log('assertion failed', a, b);
    die();
  }
}

function fillSubTree(treeStructure, positions, startPosition, subTrees) {
  var tree = [];
  var j=startPosition;
  var k=0;
  for(i=0; i<treeStructure.length; i++) {
    if (treeStructure[i]==='1') {
      tree.push([positions[j], positions[j+1], positions[j+2]]);
      j += 3;
    } else if (treeStructure[i]==='2') {
      tree.push(subTree[k]);
      k++;
    } else {
      tree.push(positions[j]);
      j++;
    }
  }
  return {
    tree: tree,
    numPositionsUsed: j
  };
}
function fillTree(treeStructure, positions) {
  var i, j, mainTree, subTree;
  if (typeof treeStructure === 'undefined') {
    return positions;
  }
  if (treeStructure.length === 3) {
    subTree = fillSubTree(treeStructure, positions, 0, []);
    //console.log('tree for', treeStructure, positions, subTree.tree);
    return subTree.tree;
  }
  if (treeStructure.length === 6) {
    subTree = fillSubTree(treeStructure.substring(3), positions, 0, []);
    mainTree = fillSubTree(treeStructure.substring(0, 3), positions, subTree.numPositionsUsed, [subTree.tree]);
    //console.log('tree for', treeStructure, positions, mainTree.tree);
    return mainTree.tree;
  }
  console.log('could not fill tree', treeStructure, positions);
  die();
}

//generates the iteration-th possible expression tree, given numInnerNodes, treeStructure, and options per leaf:
function calcNthExpression(iteration, numInnerNodes, treeStructure, numVars) {
  var numPositions = 1 + 2 * numInnerNodes,
    numAtomOptions = 2 + 2 * numVars;
  if (numVars > 4) {
    console.log('sorry, we use iteration.toString and can only parseInt from digits 0-9');
    die();
  }
  if (numInnerNodes === 0) {
    return makeAtom(iteration);
  }
  var positions = zeroes(iteration.toString(numAtomOptions), numPositions).split('').map(function(str) {
    return makeAtom(parseInt(str));
  });
  return fillTree(treeStructure, positions);
}

//calculates whether an atomic expression is true or false, given a valuation (array of booleans) vals:
function calcAtomicExpressionTruth(expression, vals) {
  if (expression === '0') {
    return false;
  }
  if (expression === '1') {
    return true;
  }
  var letter = ['a', 'b', 'c', 'd'];
  for (var i=0; i<letter.length; i++) {
    if (expression === letter[i]+'\'') {
      return (!vals[i]);
    }
    if (expression === letter[i]) {
      return (vals[i]);
    }
  }
  throw new Error('unknown atom or missing valuation:' + JSON.stringify(expression) + ', vals:' + JSON.stringify(vals));
}
assert(calcAtomicExpressionTruth('a', [false]), false);

//calculates whether an expression is true or false, given a valuation (array of booleans) vals:
function calcExpressionTruth(expression, vals) {
  if (Array.isArray(expression)) {
    if (calcExpressionTruth(expression[0], vals)) {
      return calcExpressionTruth(expression[1], vals);
    } else {
      return calcExpressionTruth(expression[2], vals);
    }
  } else {
    return calcAtomicExpressionTruth(expression, vals);
  }
}
assert(calcExpressionTruth(['a', 'b', '0'], [false, true]), false);

//prints out how the expression behaves for various valuations, as a string of 0's and 1's
function printExpressionBehavior(expression, numVars) {
  var str = '', vals;
  for (var i=0; i<Math.pow(2, numVars); i++) {
    vals = zeroes(i.toString(2), numVars).split('').map(function(str) {
      return (str === '1');
    });
    str += (calcExpressionTruth(expression, vals) ? '1' : '0');
  }
  return str;
}
assert(printExpressionBehavior(['a', 'b', '0'], 2), '0001');

function calcTreeStructures(numInnerNodes) {
  if (numInnerNodes <= 1) {
    return [undefined];
  } else if (numInnerNodes === 2) {
    return [
      '010',// '001',
      '100'
    ];
  } else if (numInnerNodes === 3) {
    return ['011', '101',// '110',
//      '020010', '020001', '020100',
//      '002010', '002001', '002100',
//      '200010', '200001', '200100',
    ];
  } else if (numInnerNodes === 4) {
    return ['111',
//      '021010', '021001', '021100',
//      '012010', '012001', '012100',
//      '201010', '201001', '201100',
//      '120010', '120001', '120100',
//      '102010', '102001', '102100',
//      '210010', '210001', '210100',
//      '020110', '020011', '020101',
//      '002110', '002011', '002101',
//      '200110', '200011', '200101',
    ];
  } else {
    console.log('cannot yet calculate tree structures for ' + numInnerNodes + ' inner nodes!');
    die();
  }
}

function calcFor(numInnerNodes, numVars, optimal) {
  var i, j, somethingStillUndefined,
    numPositions = 1 + numInnerNodes *2,
    numAtomOptions = 2 + 2*numVars,
    numCombinations = Math.pow(numAtomOptions, numPositions),
    treeStructures = calcTreeStructures(numInnerNodes);
  console.log('calc for ' + numInnerNodes + ' inner nodes, ' + numVars + ' vars; '
      + numPositions + ' positions and ' + numAtomOptions + ' atom options make for '
      + numCombinations + ' combinations times ' + treeStructures.length + ' tree structures to loop through:');
  startTime = new Date().getTime();
  for (i=0; i<treeStructures.length; i++) {
    console.log('still undefined before tree structure '+treeStructures[i]);
    somethingStillUndefined = printOutcome(numVars, optimal, true);
    if(somethingStillUndefined) {
      for (j=0; j<numCombinations; j++) {
        var expression = calcNthExpression(j, numInnerNodes, treeStructures[i], numVars);
        if (!optimal[printExpressionBehavior(expression, numVars)]) {
          optimal[printExpressionBehavior(expression, numVars)] = expression;
          console.log(printExpression(expression));
        }
      }
    }
  }
  console.log('Spent '+(new Date().getTime() - startTime)/1000+' seconds.');
  return optimal;
}

function doubleUp(previousResults) {
  var i, j, str, optimal = {};
  for (i in previousResults) {
    str = '';
    for (j=0; j<i.length; j++) {
      str += i[j]+i[j];
    }
    optimal[str] = previousResults[i];
  }
  return optimal;
}
function expressionSize(expression) {
  if (Array.isArray(expression)) {
    return expressionSize(expression[0])
        + expressionSize(expression[0])
        + expressionSize(expression[0])
        + 1;
  } else {
    return 0;
  }
}
function branchOnVar(branchVar, previousResults, optimal, maxSize) {
  var i, j, k, str;

  for (i in previousResults) {
    for (j in previousResults) {
      str = '';
      for (k=0; k<i.length; k++) {
        str += i[k]+j[k];
      }
      
      if ((!optimal[str]) && expressionSize(previousResults[i])+expressionSize(previousResults[k])<maxSize) {
        optimal[str] = [['a', 'b', 'c', 'd', 'e', 'f', 'g'][branchVar], previousResults[i], previousResults[j]];
      }
    }
  }
  return optimal;
}

function runForVars(numVars, previousResults) {
  var optimal, numInnerNodes, somethingStillUndefined = true;
  optimal = doubleUp(previousResults);
  console.log('undefined after doubleUp:');
  somethingStillUndefined = printOutcome(numVars, optimal, true);
  
  for (numInnerNodes = 0; numInnerNodes <= numVars; numInnerNodes++) {
    optimal = branchOnVar(numVars-1, previousResults, optimal, numInnerNodes);
    optimal = calcFor(numInnerNodes, numVars, optimal);
  }
  printOutcome(numVars, optimal);
  return optimal;
}

//...
var previousResults = {};
for (var numVars = 1; numVars <= 3; numVars++) {
  previousResults = runForVars(numVars, previousResults);
}

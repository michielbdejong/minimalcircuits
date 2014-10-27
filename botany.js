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

 var ALLOW_VARS_AS_ATOMS = false;
 //var ALLOW_VARS_AS_ATOMS = true;

function getBootstrap(numVars, previousResult) {
  var result = {}, leftBehavior, rightBehavior, thisBehavior, subBehaviors, varNum, i;
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
      propose(expressions.mergeBehaviors(varNum, numVars, leftBehavior, leftBehavior),
          expressions.insertVar(varNum, previousResult[leftBehavior]));
    }
  }
  for (i=0; i < Math.pow(2, Math.pow(2, numVars)); i++) {
    thisBehavior = expressions.makeBehavior(i, numVars);
    if (typeof result[thisBehavior] === 'undefined') {
      for (varNum = 0; varNum < numVars; varNum++) {
        subBehaviors = expressions.splitBehavior(varNum, numVars, thisBehavior);
        propose(expressions.mergeBehaviors(varNum, numVars, subBehaviors.left, subBehaviors.right),
            [expressions.makeAtom(true, varNum),
             expressions.insertVar(varNum, previousResult[subBehaviors.right]),
             expressions.insertVar(varNum, previousResult[subBehaviors.left])
            ]);
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

// constant: true/false (always 2) fills up 0 vars
// atom: a, a', b, b', etc. (always 2*numVar) fills up 1 vars
// straight-port: a/a' AND b/b', a/a' OR b/b' (these have one 1 or one 0, so there are 2* 2^numVar of them)
// xor: a XOR b, a XOR b' XOR c', etc. (these have no don't cares ever; there 2 of them for 2 vars, so they fill that up)

// put another way:
// constants 000* and 111* depend on 0 vars
// atoms depend on one var
// we can define a straight-port(n) as depending on n vars and having either one 1 or one 0. so it's like checking for that one valuation. check the vars one by one, doesn't matter in which order, until you either find one that differs, or you don't and that's bingo. 
// then we can define xor as a fully-dependent clique - doesn't matter in which order you check the variables, you always have to check all remaining ones.
// an xor that has one bit flipped can be done in one step less for that flipped case, as well as for all its Manhattan-distance neighboring valuations
// for two flipped bits, that is the case twice, plus for valuations that neighbor both flipped ones, ... and if you flip two neighbors...
// XOR: 1001011001101001
// X:   0001011001101001
//      xnn1n110n1101001
// Y1:  1001011001101000
//      100101100110100y
//      xn  n  nn  n  ny<-two bits flipped but you can't use them together
// CO1: 0001011001101000

// XOR: 1001011001101001
// X:   0001011001101001
//      xnn1n110n1101001
// Y2:  1101011001101001
//      ny0n0n100n101001
//      xynnnn  nn      <- the first xynn block is a three-node gain. the others also play together
// CO2: 010101100101001


           XOR X   Y1  CO1 Y2  CO2
      c  d 1   1   0   0*  1   1
   b    d' 0   0   0   0d  0   0
      c' d 0   0   0   0   0   0
a       d' 1   1   1   1   1   1
      c  d 0   0   0   0c  0   0
   b'   d' 1   1   1   1   1   1
      c' d 1   1   1   1   1   1a  b'c'd
        d' 0   0   0   0b  0   0a  b'c'd'
      c  d 0   0   0   0b  0   0
   b    d' 1   1   1   1   1   1
      c' d 1   1   1   1   1   1b  a'c'd
a'      d' 0   0   0   0c  0   0b  a'c'd'
      c  d 1   1   1   1   1   1c  a'b'd
   b'   d' 0   0   0   0   0   0c  a'b'd'
      c' d 0   0   0   0d  1   1*
        d' 1   0   1   0*  1   0*

flips from xor, type, nodes, inverse in one var:
00 1 const 0 11
01 0 xor   1 10
===============
10 0 xor
11 1 const

flips from xor, type, nodes, inverse in two vars:
0000 2 const	0 1111
0001 1 straight 2 1110
0010 1 straight 2 1101
0011 2 var	1 1100
0100 1 straight 2 1011
0101 2 var	1 1010
0110 0 xor	3 1001
0111 1 straight	2 1000
======================
1000 1 straight 2
1001 0 xor	3
1010 2 var	1
1011 1 straight	2
1100 2 var	1
1101 1 straight	2
1110 1 straight	2
1111 2 const	0


   0
 b
   1
a
   1
 b
   0

we always start with 2^n-1 ports for xor.
then for instance 0101 flips a whole subtree exactly, thus removing the top layer, leading to 2^(n-1)-1 nodes:

  0
b
  1

then for instance 0011 flips two leafs, thus removing both middle layers, leading to 2^n-1 - 2 nodes:

  0
a
  1

there are always 2^(2^numVar) functions from numVar inputs to one output.
of these, we only have to study the ones that start with a zero, because the others are just their inverses.

we can make the concept of a straight more generic: a var is a straight in 1 var, etc.

in one var, that means 1 xor, 1 const.
in two vars, that means 1 xor, 1 const, 4 straight(2)s (2^2), 2 straight(1)s (one for each var).
in three vars, you would have 1 xor, 1 const, 3 straight(1)s, 3x4 straight(2)s, 8 straight(3)s, and then another 2^7-25=103 other types for which i have to do the botany now.



Minimal sizes of expressions in 0 vars:
0(2): ["0","1"]
Minimal sizes of expressions in 1 vars:
0(2): ["00","11"]
1(2): ["01","10"]
Minimal sizes of expressions in 2 vars:
0(2): ["0000","1111"]
1(4): ["0011","0101","1010","1100"]
2(8): ["0001","0010","0100","0111","1000","1011","1101","1110"]
3(2): ["0110","1001"]
Minimal sizes of expressions in 3 vars:
0(2): ["00000000","11111111"]
1(6): ["00001111","00110011","01010101","10101010","11001100","11110000"]
2(24): ["00000011","00000101","00001010","00001100","00010001","00100010","00110000","00111111","01000100","01010000","01011111","01110111","10001000","10100000","10101111","10111011","11000000","11001111","11011101","11101110","11110011","11110101","11111010","11111100"]
3(94): ["00000001","00000010","00000100","00000111","00001000","00001011","00001101","00001110","00010000","00010011","00010101","00011011","00011101","00011111","00100000","00100011","00100111","00101010","00101110","00101111","00110001","00110010","00110101","00110111","00111010","00111011","00111100","01000000","01000101","01000111","01001100","01001110","01001111","01010001","01010011","01010100","01010111","01011010","01011100","01011101","01100110","01110000","01110010","01110011","01110100","01110101","01111111","10000000","10001010","10001011","10001100","10001101","10001111","10011001","10100010","10100011","10100101","10101000","10101011","10101100","10101110","10110000","10110001","10110011","10111000","10111010","10111111","11000011","11000100","11000101","11001000","11001010","11001101","11001110","11010000","11010001","11010101","11011000","11011100","11011111","11100000","11100010","11100100","11101010","11101100","11101111","11110001","11110010","11110100","11110111","11111000","11111011","11111101","11111110"]
4(72): ["00000110","00001001","00010010","00010100","00011001","00011010","00011100","00100001","00100101","00100110","00101000","00101100","00110100","00111000","00111101","00111110","01000001","01000011","01000110","01001000","01001010","01010010","01011000","01011011","01011110","01100000","01100010","01100100","01100111","01101110","01101111","01110110","01111010","01111011","01111100","01111101","10000010","10000011","10000100","10000101","10001001","10010000","10010001","10011000","10011011","10011101","10011111","10100001","10100100","10100111","10101101","10110101","10110111","10111001","10111100","10111110","11000001","11000010","11000111","11001011","11010011","11010111","11011001","11011010","11011110","11100011","11100101","11100110","11101011","11101101","11110110","11111001"]
5(40): ["00010111","00011000","00011110","00100100","00101011","00101101","00110110","00111001","01000010","01001011","01001101","01010110","01011001","01100011","01100101","01101010","01101100","01110001","01111000","01111110","10000001","10000111","10001110","10010011","10010101","10011010","10011100","10100110","10101001","10110010","10110100","10111101","11000110","11001001","11010010","11010100","11011011","11100001","11100111","11101000"]
6(16): ["00010110","00101001","01001001","01100001","01101000","01101011","01101101","01111001","10000110","10010010","10010100","10010111","10011110","10110110","11010110","11101001"]
7(2): ["01101001","10010110"]

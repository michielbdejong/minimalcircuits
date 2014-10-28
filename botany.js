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


see also http://www.mathcs.duq.edu/~jackson/Research/LiviaOverand/3variable.pdf for 14 cases

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

Minimal sizes of expressions in 0 vars that start with "0":
0(1): ["0"] const
Minimal sizes of expressions in 1 vars that start with "0":
0(1): ["00"] const
1(1): ["01"] xor
Minimal sizes of expressions in 2 vars that start with "0":
0(1): ["0000"] const
1(2): ["0011","0101"] straight(1)
2(4): ["0001","0010","0100","0111"] straight(2)
3(1): ["0110"] xor
Minimal sizes of expressions in 3 vars that start with "0":
0(1): ["00000000"] const
1(3): ["00001111","00110011","01010101"] straight(1)
2(12): ["00000011","00000101","00001010","00001100","00010001","00100010","00110000","00111111","01000100","01010000","01011111","01110111"] straight(2)
3(47): [
"00000001","00000010","00000100","00001000","00010000","00100000","01000000","01111111", straight(3)

"00000111","00001011","00001101","00001110", const(a')+straight(b,c)
"01110000","00011111","00101111","01001111", const(a)+straight(b,c)

"00010011", "00100011", "00110001", "00110010", const(b')+straight(a,c)
"01001100", "00110111", "00111011", "01110011", const(b)+straight(a,c)

"00010101", "01000101", "01010001", "01010100", const(c')+straight(a,b)
"00101010", "01010111", "01110101", "01011101", const(c)+straight(a,b)


"00011011",


a 1011
  0001
b 0111
  0010
c 0011
  0101

"00011101", "00100111", "00101110", "00110101", 
"00111010", "00111100", "01000111", "01010011", 
"01011010", "01011100", "01100110", "01110010", "01110100", 

"01001110", abc
  c0
 b 1
  1
a
  0
 b
  c1
   0

a 1110
  0100

b 0010
  0111

c 1010
  0011

   c0   a
[ b 1 ] 
   c1   
    0


]
4(36): ["00000110","00001001","00010010","00010100","00011001","00011010","00011100","00100001","00100101","00100110","00101000","00101100","00110100","00111000","00111101","00111110","01000001","01000011","01000110","01001000","01001010","01010010","01011000","01011011","01011110","01100000","01100010","01100100","01100111","01101110","01101111","01110110","01111010","01111011","01111100","01111101"]
5(20): ["00010111","00011000","00011110","00100100","00101011","00101101","00110110","00111001","01000010","01001011","01001101","01010110","01011001","01100011","01100101","01101010","01101100","01110001","01111000","01111110"]
6(8): ["00010110","00101001","01001001","01100001","01101000","01101011","01101101","01111001"] flip(1)
7(1): ["01101001"] xor
Optimal Boolean expressions using only atoms and the if-then-else operator, in 0 variables:
0: false
Optimal Boolean expressions using only atoms and the if-then-else operator, in 1 variables:
00: false
01: if (a) then (true) else (false)
Optimal Boolean expressions using only atoms and the if-then-else operator, in 2 variables:
0000: false
0001: if (a) then (if (b) then (true) else (false)) else (false)
0010: if (a) then (if (b) then (false) else (true)) else (false)
0011: if (a) then (true) else (false)
0100: if (a) then (false) else (if (b) then (true) else (false))
0101: if (b) then (true) else (false)
0110: if (a) then (if (b) then (false) else (true)) else (if (b) then (true) else (false))
0111: if (a) then (true) else (if (b) then (true) else (false))
Optimal Boolean expressions using only atoms and the if-then-else operator, in 3 variables:
00000000: false
00000001: if (a) then (if (b) then (if (c) then (true) else (false)) else (false)) else (false)
00000010: if (a) then (if (b) then (if (c) then (false) else (true)) else (false)) else (false)
00000011: if (a) then (if (b) then (true) else (false)) else (false)
00000100: if (a) then (if (b) then (false) else (if (c) then (true) else (false))) else (false)
00000101: if (a) then (if (c) then (true) else (false)) else (false)
00000110: if (a) then (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))) else (false)
00000111: if (a) then (if (b) then (true) else (if (c) then (true) else (false))) else (false)
00001000: if (a) then (if (b) then (false) else (if (c) then (false) else (true))) else (false)
00001001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (false)
00001010: if (a) then (if (c) then (false) else (true)) else (false)
00001011: if (a) then (if (b) then (true) else (if (c) then (false) else (true))) else (false)
00001100: if (a) then (if (b) then (false) else (true)) else (false)
00001101: if (a) then (if (b) then (if (c) then (true) else (false)) else (true)) else (false)
00001110: if (a) then (if (b) then (if (c) then (false) else (true)) else (true)) else (false)
00001111: if (a) then (true) else (false)
00010000: if (a) then (false) else (if (b) then (if (c) then (true) else (false)) else (false))
00010001: if (b) then (if (c) then (true) else (false)) else (false)
00010010: if (b) then (if (a) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))) else (false)
00010011: if (b) then (if (a) then (true) else (if (c) then (true) else (false))) else (false)
00010100: if (c) then (if (a) then (if (b) then (false) else (true)) else (if (b) then (true) else (false))) else (false)
00010101: if (c) then (if (a) then (true) else (if (b) then (true) else (false))) else (false)
00010110: if (a) then (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))) else (if (b) then (if (c) then (true) else (false)) else (false))
00010111: if (a) then (if (b) then (true) else (if (c) then (true) else (false))) else (if (b) then (if (c) then (true) else (false)) else (false))
00011000: if (a) then (if (b) then (false) else (if (c) then (false) else (true))) else (if (b) then (if (c) then (true) else (false)) else (false))
00011001: if (b) then (if (c) then (true) else (false)) else (if (a) then (if (c) then (false) else (true)) else (false))
00011010: if (a) then (if (c) then (false) else (true)) else (if (b) then (if (c) then (true) else (false)) else (false))
00011011: if (c) then (if (b) then (true) else (false)) else (if (a) then (true) else (false))
00011100: if (a) then (if (b) then (false) else (true)) else (if (b) then (if (c) then (true) else (false)) else (false))
00011101: if (b) then (if (c) then (true) else (false)) else (if (a) then (true) else (false))
00011110: if (a) then (if (b) then (if (c) then (false) else (true)) else (true)) else (if (b) then (if (c) then (true) else (false)) else (false))
00011111: if (a) then (true) else (if (b) then (if (c) then (true) else (false)) else (false))
00100000: if (a) then (false) else (if (b) then (if (c) then (false) else (true)) else (false))
00100001: if (b) then (if (a) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (false)
00100010: if (b) then (if (c) then (false) else (true)) else (false)
00100011: if (b) then (if (a) then (true) else (if (c) then (false) else (true))) else (false)
00100100: if (a) then (if (b) then (false) else (if (c) then (true) else (false))) else (if (b) then (if (c) then (false) else (true)) else (false))
00100101: if (a) then (if (c) then (true) else (false)) else (if (b) then (if (c) then (false) else (true)) else (false))
00100110: if (b) then (if (c) then (false) else (true)) else (if (a) then (if (c) then (true) else (false)) else (false))
00100111: if (c) then (if (a) then (true) else (false)) else (if (b) then (true) else (false))
00101000: if (c) then (false) else (if (a) then (if (b) then (false) else (true)) else (if (b) then (true) else (false)))
00101001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (if (b) then (if (c) then (false) else (true)) else (false))
00101010: if (c) then (false) else (if (a) then (true) else (if (b) then (true) else (false)))
00101011: if (a) then (if (b) then (true) else (if (c) then (false) else (true))) else (if (b) then (if (c) then (false) else (true)) else (false))
00101100: if (a) then (if (b) then (false) else (true)) else (if (b) then (if (c) then (false) else (true)) else (false))
00101101: if (a) then (if (b) then (if (c) then (true) else (false)) else (true)) else (if (b) then (if (c) then (false) else (true)) else (false))
00101110: if (b) then (if (c) then (false) else (true)) else (if (a) then (true) else (false))
00101111: if (a) then (true) else (if (b) then (if (c) then (false) else (true)) else (false))
00110000: if (a) then (false) else (if (b) then (true) else (false))
00110001: if (b) then (if (a) then (if (c) then (true) else (false)) else (true)) else (false)
00110010: if (b) then (if (a) then (if (c) then (false) else (true)) else (true)) else (false)
00110011: if (b) then (true) else (false)
00110100: if (a) then (if (b) then (false) else (if (c) then (true) else (false))) else (if (b) then (true) else (false))
00110101: if (a) then (if (c) then (true) else (false)) else (if (b) then (true) else (false))
00110110: if (a) then (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))) else (if (b) then (true) else (false))
00110111: if (b) then (true) else (if (a) then (if (c) then (true) else (false)) else (false))
00111000: if (a) then (if (b) then (false) else (if (c) then (false) else (true))) else (if (b) then (true) else (false))
00111001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (if (b) then (true) else (false))
00111010: if (a) then (if (c) then (false) else (true)) else (if (b) then (true) else (false))
00111011: if (b) then (true) else (if (a) then (if (c) then (false) else (true)) else (false))
00111100: if (a) then (if (b) then (false) else (true)) else (if (b) then (true) else (false))
00111101: if (a) then (if (b) then (if (c) then (true) else (false)) else (true)) else (if (b) then (true) else (false))
00111110: if (a) then (if (b) then (if (c) then (false) else (true)) else (true)) else (if (b) then (true) else (false))
00111111: if (a) then (true) else (if (b) then (true) else (false))
01000000: if (a) then (false) else (if (b) then (false) else (if (c) then (true) else (false)))
01000001: if (c) then (if (a) then (if (b) then (true) else (false)) else (if (b) then (false) else (true))) else (false)
01000010: if (a) then (if (b) then (if (c) then (false) else (true)) else (false)) else (if (b) then (false) else (if (c) then (true) else (false)))
01000011: if (a) then (if (b) then (true) else (false)) else (if (b) then (false) else (if (c) then (true) else (false)))
01000100: if (b) then (false) else (if (c) then (true) else (false))
01000101: if (c) then (if (a) then (true) else (if (b) then (false) else (true))) else (false)
01000110: if (b) then (if (a) then (if (c) then (false) else (true)) else (false)) else (if (c) then (true) else (false))
01000111: if (b) then (if (a) then (true) else (false)) else (if (c) then (true) else (false))
01001000: if (b) then (false) else (if (a) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01001001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (if (b) then (false) else (if (c) then (true) else (false)))
01001010: if (a) then (if (c) then (false) else (true)) else (if (b) then (false) else (if (c) then (true) else (false)))
01001011: if (a) then (if (b) then (true) else (if (c) then (false) else (true))) else (if (b) then (false) else (if (c) then (true) else (false)))
01001100: if (b) then (false) else (if (a) then (true) else (if (c) then (true) else (false)))
01001101: if (a) then (if (b) then (if (c) then (true) else (false)) else (true)) else (if (b) then (false) else (if (c) then (true) else (false)))
01001110: if (c) then (if (b) then (false) else (true)) else (if (a) then (true) else (false))
01001111: if (a) then (true) else (if (b) then (false) else (if (c) then (true) else (false)))
01010000: if (a) then (false) else (if (c) then (true) else (false))
01010001: if (c) then (if (a) then (if (b) then (true) else (false)) else (true)) else (false)
01010010: if (a) then (if (b) then (if (c) then (false) else (true)) else (false)) else (if (c) then (true) else (false))
01010011: if (a) then (if (b) then (true) else (false)) else (if (c) then (true) else (false))
01010100: if (c) then (if (a) then (if (b) then (false) else (true)) else (true)) else (false)
01010101: if (c) then (true) else (false)
01010110: if (a) then (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))) else (if (c) then (true) else (false))
01010111: if (c) then (true) else (if (a) then (if (b) then (true) else (false)) else (false))
01011000: if (a) then (if (b) then (false) else (if (c) then (false) else (true))) else (if (c) then (true) else (false))
01011001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (if (c) then (true) else (false))
01011010: if (a) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))
01011011: if (a) then (if (b) then (true) else (if (c) then (false) else (true))) else (if (c) then (true) else (false))
01011100: if (a) then (if (b) then (false) else (true)) else (if (c) then (true) else (false))
01011101: if (c) then (true) else (if (a) then (if (b) then (false) else (true)) else (false))
01011110: if (a) then (if (b) then (if (c) then (false) else (true)) else (true)) else (if (c) then (true) else (false))
01011111: if (a) then (true) else (if (c) then (true) else (false))
01100000: if (a) then (false) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01100001: if (a) then (if (b) then (if (c) then (true) else (false)) else (false)) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01100010: if (b) then (if (c) then (false) else (true)) else (if (a) then (false) else (if (c) then (true) else (false)))
01100011: if (a) then (if (b) then (true) else (false)) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01100100: if (b) then (if (a) then (false) else (if (c) then (false) else (true))) else (if (c) then (true) else (false))
01100101: if (a) then (if (c) then (true) else (false)) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01100110: if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false))
01100111: if (b) then (if (a) then (true) else (if (c) then (false) else (true))) else (if (c) then (true) else (false))
01101000: if (a) then (if (b) then (false) else (if (c) then (false) else (true))) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01101001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01101010: if (a) then (if (c) then (false) else (true)) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01101011: if (a) then (if (b) then (true) else (if (c) then (false) else (true))) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01101100: if (a) then (if (b) then (false) else (true)) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01101101: if (a) then (if (b) then (if (c) then (true) else (false)) else (true)) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01101110: if (b) then (if (c) then (false) else (true)) else (if (a) then (true) else (if (c) then (true) else (false)))
01101111: if (a) then (true) else (if (b) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01110000: if (a) then (false) else (if (b) then (true) else (if (c) then (true) else (false)))
01110001: if (a) then (if (b) then (if (c) then (true) else (false)) else (false)) else (if (b) then (true) else (if (c) then (true) else (false)))
01110010: if (c) then (if (a) then (false) else (true)) else (if (b) then (true) else (false))
01110011: if (b) then (true) else (if (a) then (false) else (if (c) then (true) else (false)))
01110100: if (b) then (if (a) then (false) else (true)) else (if (c) then (true) else (false))
01110101: if (c) then (true) else (if (a) then (false) else (if (b) then (true) else (false)))
01110110: if (b) then (if (a) then (if (c) then (false) else (true)) else (true)) else (if (c) then (true) else (false))
01110111: if (b) then (true) else (if (c) then (true) else (false))
01111000: if (a) then (if (b) then (false) else (if (c) then (false) else (true))) else (if (b) then (true) else (if (c) then (true) else (false)))
01111001: if (a) then (if (b) then (if (c) then (true) else (false)) else (if (c) then (false) else (true))) else (if (b) then (true) else (if (c) then (true) else (false)))
01111010: if (a) then (if (c) then (false) else (true)) else (if (b) then (true) else (if (c) then (true) else (false)))
01111011: if (b) then (true) else (if (a) then (if (c) then (false) else (true)) else (if (c) then (true) else (false)))
01111100: if (a) then (if (b) then (false) else (true)) else (if (b) then (true) else (if (c) then (true) else (false)))
01111101: if (c) then (true) else (if (a) then (if (b) then (false) else (true)) else (if (b) then (true) else (false)))
01111110: if (a) then (if (b) then (if (c) then (false) else (true)) else (true)) else (if (b) then (true) else (if (c) then (true) else (false)))
01111111: if (a) then (true) else (if (b) then (true) else (if (c) then (true) else (false)))

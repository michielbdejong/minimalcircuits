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

var cases = {};
function setCases() {
  var i, str, str1, str2, strs;

  //case 1: one 1 -> straight(3)
  //rowOrBlock('0001', '0010', '0100', '1000')
  str = '00000001';
  for (i=0; i<8; i++) {    
    cases[str] = 1;
    str = str.substring(1)+str[0];
  }

  //case 2: two 1's, differing in 1 var -> straight(2)
  //rowOrBlock('1100', '0110', '0011', '1001')
  var strs = ['1100', '0110', '0011', '1001'];
  for (i=0; i<strs.length; i++) {
    cases[strs[i]+'0000'] = 2;
    cases['0000'+strs[i]] = 2;
  }
  str = '10001000';
  for (i=0; i<4; i++) {    
    cases[str] = 2;
    str = str.substring(1)+str[0];
  }

  //case 3: two 1's, differing in 2 vars -> const+straight(1)
  //rowOrBlock('1010', '0101')
  strs = ['1010', '0101'];
  for (i=0; i<strs.length; i++) {
    cases[strs[i]+'0000'] = 3;
    cases['0000'+strs[i]] = 3;
  }
  str1 = '1000';
  str2 = '0100';
  for (i=0; i<4; i++) {    
    cases[str1+str2] = 3;
    cases[str2+str1] = 3;
    str1 = str1.substring(1)+str1[0];
    str2 = str2.substring(1)+str2[0];
  }

  //case 4: two 1's, differing in 3 vars -> 2x straight(3)
  //threeVarSplit('1', '1')
  cases['10000010']=4;
  cases['01000001']=4;
  cases['00101000']=4;
  cases['00010100']=4;

  //case 5: three 1's, adjacant
  //rowOrBlock('1110', '1101', '1011', '0111')

  //case 6: three 1's, two of them adjacent
  //twoVarSplit('11', ['01', '10'])

  //case 7: three 1's, none adjacent -> 3x straight(3)
  //threeQuarterRowOrBlock('100110')

  //case 8: four 1's, all adjacent
  //rowOrBlock('1111')

  //case 9: four 1's, three of them adjacent
  //oneVarSplit(['1110', '1101', '1011', '0111'], ['0001', '0010', '0100', '1000'])

  //case 10: four 1's, snake-like-adjacent
  //threeQuarterRowOrBlock('011110')

  //case 11: four 1's, wedge-like-adjacent
  //threeQuarterRowOrBlock('011101')

  //case 12: four 1's, adjacent in two pairs
  //twoVarSplit('11', '11')

  //case 13: four 1's, none adjacent -> xor
  //xor

  //case 14: eight 1's
  cases['11111111']=14;
}

function printKMaps(numVars, numCols) {
  var col=0, lines=['', ''], thisBehavior;
  for (var i=0; i<Math.pow(2, Math.pow(2, numVars)); i++) {
    thisBehavior = expressions.makeBehavior(i, numVars);
    lines[0] += thisBehavior.substring(0, 4) + '\t';
    lines[1] += thisBehavior.substring(4) + ' ' + (cases[thisBehavior] || 'u') + '\t';
    if (++col === numCols) {
      console.log(lines[0]);
      console.log(lines[1] + '\n');
      lines = ['', ''];
      col = 0;
    }
  }
}

//...
setCases();
console.log(cases);
printKMaps(3, 16);

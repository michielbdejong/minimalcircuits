# Minimal circuits

To run:

````bash
node doublingUp.js
````

This script calculates minimal Boolean expressions
for all behaviors in `n` Boolean inputs and one Boolean output, using only:

* the literals true and false
* the literals x and x' (for x an input variable a, b, c, etc., and the ' denoting negation)
* the tertiary `if (x) then (y) else (z)` operator, defined as follows (`0=false, 1=true`):

x y z `if (x) then (y) else (z)`
0 0 0           0
0 0 1           1
0 1 0           0
0 1 1           1
1 0 0           0
1 0 1           0
1 1 0           1
1 1 1           1

I used this script to investigate if there would be a behavior for which it is suboptimal to use a
literal in for `x` in the root operator. There is, namely for instance all expressions structurally
similar to:

`if ( if (a) then (b) else (b') ) then (c) else (c')`

The top conditional here behaves as `(a XOR b)`, and it is more efficient to branch on that than to
only branch on `a` first and then have to branch on `b` in both subsequent cases, like for instance:

`if (a) then (if (b) then (c) else (c')) else (if (b) then (c') else (c))`

So this proves, by enumeration, that using conditionals in computer programs can reduce the program
size (even if on non-quantum hardware it increases the execution time).

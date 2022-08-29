#! /usr/bin/env python3

import sys

file = open(sys.argv[1])
for line in file:
    new = line.replace("const {", "let {")
    new = new.replace("const ", " ")
    new = new.replace('require("./', 'require("./scripts/')
    new = new.replace('require("../', 'require("./')
    print(new, end="")

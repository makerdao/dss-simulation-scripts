#! /usr/bin/env python3

file = open("./scripts/ES.js")
for line in file:
    new = line.replace("const {", "let {")
    new = new.replace("const ", " ")
    new = new.replace('require("./', 'require("./scripts/')
    new = new.replace('require("../', 'require("./')
    print(new, end="")

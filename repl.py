#! /usr/bin/env python3

file = open("./scripts/ESSingle.js")
for line in file:
    new = line.replace("const {", "let {")
    new = new.replace("const", "")
    new = new.replace('require("./', 'require("./scripts/')
    new = new.replace('require("../', 'require("./')
    if "ES" in line:
        continue
    print(new, end="")

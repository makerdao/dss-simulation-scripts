#! /usr/bin/env python3

file = open("./scripts/ESSingle.js")
for line in file:
    new = line.replace("const", "")
    new = new.replace('require("./', 'require("./scripts/')
    if "ES" in line:
        continue
    print(new, end="")

#! /usr/bin/env node

const snowflake = require("../utils/snowflake");

const test = async () => {
  const holders = await snowflake.getHolders(15364430);
  console.log(holders);
}

test();

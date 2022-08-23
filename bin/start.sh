#!/bin/sh
#
#
LATEST_BLOCK_NUMBER=$(cast block latest number)
BLOCK_NUMBER=$((LATEST_BLOCK_NUMBER - 5))
echo $BLOCK_NUMBER
yarn hardhat node --hostname 127.0.0.1 --network hardhat --fork-block-number $BLOCK_NUMBER

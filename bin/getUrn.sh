#!/bin/sh
#
# ./getUrn.sh <id>
seth call 0x5ef30b9986345249bc32d8928B7ee64DE9435E39 'urns(uint256)(address)' \
  $(seth --to-uint256 ${1}) \

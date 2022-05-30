#!/bin/sh
#
# ./getUrn.sh <id>
# owner in cdp manager indicates if the cdp was created through the cdp registry
owner=$(seth call 0x5ef30b9986345249bc32d8928B7ee64DE9435E39 'owns(uint256)(address)' \
  $(seth --to-uint256 ${1}))

if [ "$owner" = "0xBe0274664Ca7A68d6b5dF826FB3CcB7c620bADF3" ]; then
  # urn details are in the cdp registry
  urnProxy=$(seth call 0xBe0274664Ca7A68d6b5dF826FB3CcB7c620bADF3 'owns(uint256)(address)' \
    $(seth --to-uint256 ${1}))
  # fetch the actual urn from cropper
  seth call 0x8377CD01a5834a6EaD3b7efb482f678f2092b77e 'proxy(address)(address)' $urnProxy
else
  # urn details are in the cdp manager
  seth call 0x5ef30b9986345249bc32d8928B7ee64DE9435E39 'urns(uint256)(address)' \
    $(seth --to-uint256 ${1})
fi

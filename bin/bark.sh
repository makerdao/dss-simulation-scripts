#!/bin/sh
#
# ./bark.sh <ilkl> <id>

seth estimate 0x135954d155898D42C90D2a57824C690e0c7BEf1B 'bark(bytes32,address,address)' \
  $(seth --to-bytes32 "$(seth --from-ascii ${1})") \
  $(./bin/getUrn.sh ${2}) \
  $ETH_FROM || exit

seth send 0x135954d155898D42C90D2a57824C690e0c7BEf1B 'bark(bytes32,address,address)' \
  $(seth --to-bytes32 "$(seth --from-ascii ${1})") \
  $(./bin/getUrn.sh ${2}) \
  $ETH_FROM

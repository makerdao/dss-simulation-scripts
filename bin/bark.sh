#!/bin/sh
#
# ./bark.sh <ilkl> <id>

urn=$2
if [[ "${2}" != "0x"* ]]; then
  urn=$(./bin/getUrn.sh ${2})
fi

seth estimate 0x135954d155898D42C90D2a57824C690e0c7BEf1B 'bark(bytes32,address,address)' \
  $(seth --to-bytes32 "$(seth --from-ascii ${1})") \
  ${urn} \
  $ETH_FROM || exit

seth send 0x135954d155898D42C90D2a57824C690e0c7BEf1B 'bark(bytes32,address,address)' \
  $(seth --to-bytes32 "$(seth --from-ascii ${1})") \
  ${urn} \
  $ETH_FROM

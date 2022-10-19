#!/bin/sh

export HARDHAT_NETWORK=localhost

price_pct=0.90 # 10% reduction in price

# ETH-A, ETH-B, ETH-C
cur=$(./bin/osm_price.sh "${PIP_ETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "ETH-A" "${PIP_ETH}" "${price}"
./scripts/setOSMPrice.js "ETH-B" "${PIP_ETH}" "${price}"
./scripts/setOSMPrice.js "ETH-C" "${PIP_ETH}" "${price}"
set +x

# WBTC-A, WBTC-B, WBTC-C, RENBTC-A
cur=$(./bin/osm_price.sh "${PIP_WBTC}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "WBTC-A" "${PIP_WBTC}" "${price}"
./scripts/setOSMPrice.js "WBTC-B" "${PIP_WBTC}" "${price}"
./scripts/setOSMPrice.js "WBTC-C" "${PIP_WBTC}" "${price}"
./scripts/setOSMPrice.js "RENBTC-A" "${PIP_RENBTC}" "${price}"
set +x

# WSTETH-A, WSTETH-B 
cur=$(./bin/osm_price.sh "${PIP_WSTETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "WSTETH-A" "${PIP_WSTETH}" "${price}"
./scripts/setOSMPrice.js "WSTETH-B" "${PIP_WSTETH}" "${price}"
set +x

# BAT-A
cur=$(./bin/osm_price.sh "${PIP_BAT}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "BAT-A" "${PIP_BAT}" "${price}"
set +x

# ZRX-A
cur=$(./bin/osm_price.sh "${PIP_ZRX}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "ZRX-A" "${PIP_ZRX}" "${price}"
set +x

# MANA-A
cur=$(./bin/osm_price.sh "${PIP_MANA}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "MANA-A" "${PIP_MANA}" "${price}"
set +x

# COMP-A
cur=$(./bin/osm_price.sh "${PIP_COMP}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "COMP-A" "${PIP_COMP}" "${price}"
set +x

# LINK-A
cur=$(./bin/osm_price.sh "${PIP_LINK}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "LINK-A" "${PIP_LINK}" "${price}"
set +x

# BAL-A
cur=$(./bin/osm_price.sh "${PIP_BAL}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "BAL-A" "${PIP_BAL}" "${price}"
set +x

# YFI-A
cur=$(./bin/osm_price.sh "${PIP_YFI}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "YFI-A" "${PIP_YFI}" "${price}"
set +x

# UNI-A
cur=$(./bin/osm_price.sh "${PIP_UNI}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNI-A" "${PIP_UNI}" "${price}"
set +x

# AAVE-A
cur=$(./bin/osm_price.sh "${PIP_AAVE}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "AAVE-A" "${PIP_AAVE}" "${price}"
set +x

# MATIC-A
cur=$(./bin/osm_price.sh "${PIP_MATIC}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "MATIC-A" "${PIP_MATIC}" "${price}"
set +x

# UNIV2DAIETH-A
cur=$(./bin/osm_price.sh "${PIP_UNIV2DAIETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNIV2DAIETH-A" "${PIP_UNIV2DAIETH}" "${price}"
set +x

# UNIV2WBTCETH-A
cur=$(./bin/osm_price.sh "${PIP_UNIV2WBTCETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNIV2WBTCETH-A" "${PIP_UNIV2WBTCETH}" "${price}"
set +x

# UNIV2USDCETH-A
cur=$(./bin/osm_price.sh "${PIP_UNIV2USDCETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNIV2USDCETH-A" "${PIP_UNIV2USDCETH}" "${price}"
set +x

# UNIV2LINKETH-A
cur=$(./bin/osm_price.sh "${PIP_UNIV2LINKETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNIV2LINKETH-A" "${PIP_UNIV2LINKETH}" "${price}"
set +x

# UNIV2UNIETH-A
cur=$(./bin/osm_price.sh "${PIP_UNIV2UNIETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNIV2UNIETH-A" "${PIP_UNIV2UNIETH}" "${price}"
set +x

# UNIV2WBTCDAI-A
cur=$(./bin/osm_price.sh "${PIP_UNIV2WBTCDAI}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "UNIV2WBTCDAI-A" "${PIP_UNIV2WBTCDAI}" "${price}"
set +x

# CRVV1ETHSTETH-A
cur=$(./bin/osm_price.sh "${PIP_CRVV1ETHSTETH}")
price=$(echo "scale=18; ${cur} * ${price_pct}"|bc)
set -x
./scripts/setOSMPrice.js "CRVV1ETHSTETH-A" "${PIP_CRVV1ETHSTETH}" "${price}"
set +x

echo "done"

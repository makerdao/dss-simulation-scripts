// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity 0.6.12;

contract SendEthDamnIt {
    address public to;

    constructor(address _to) public {
        to = _to;
    }

    receive() external payable {
      // catch any ETH sent here
    }

    function send() public payable {
        selfdestruct(payable(to));
    }
}

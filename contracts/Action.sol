// SPDX-License-Identifier: AGP-3.0-or-later

pragma solidity ^0.6.12;

interface PipLike {
    function change(address src) external;
}

interface Cageable {
    function cage() external;
}

interface MedianLike {
    function drop(address[] calldata) external;
}

contract Action {

    function change(address pip, address src) external {
        PipLike(pip).change(src);
    }

    function cage(address end) external {
        Cageable(end).cage();
    }

    function drop(address median, address[] calldata oracles) external {
        MedianLike(median).drop(oracles);
    }

}

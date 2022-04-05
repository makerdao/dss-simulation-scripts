// SPDX-License-Identifier: AGP-3.0-or-later

pragma solidity ^0.6.12;

interface PipLike { 
  function change(address src) external;
}

contract Action {
  function change(address pip, address src) external {
    PipLike(pip).change(src);
  }
}

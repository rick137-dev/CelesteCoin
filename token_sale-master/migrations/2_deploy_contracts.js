var CelesteToken = artifacts.require("./CelesteToken.sol");
var CelesteTokenSale = artifacts.require("./CelesteTokenSale.sol");

module.exports = function(deployer) {
  deployer.deploy(CelesteToken, 1000000).then(function() {
    var tokenPrice = 1000000000000000;
    return deployer.deploy(CelesteTokenSale, CelesteToken.address, tokenPrice);
  });
};

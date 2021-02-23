App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,

  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
  
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("CelesteTokenSale.json", function(CelesteTokenSale) {
      App.contracts.CelesteTokenSale = TruffleContract(CelesteTokenSale);
      App.contracts.CelesteTokenSale.setProvider(App.web3Provider);
      App.contracts.CelesteTokenSale.deployed().then(function(CelesteTokenSale) {
        console.log("Celeste Token Sale Address:", CelesteTokenSale.address);
      });
    }).done(function() {
      $.getJSON("CelesteToken.json", function(CelesteToken) {
        App.contracts.CelesteToken = TruffleContract(CelesteToken);
        App.contracts.CelesteToken.setProvider(App.web3Provider);
        App.contracts.CelesteToken.deployed().then(function(CelesteToken) {
          console.log("Celeste Token Address:", CelesteToken.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

 
  listenForEvents: function() {
    App.contracts.CelesteTokenSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();


    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $('#accountAddress').html("Your Account: " + account);
      }
    })


    App.contracts.CelesteTokenSale.deployed().then(function(instance) {
      CelesteTokenSaleInstance = instance;
      return CelesteTokenSaleInstance.tokenPrice();
    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return CelesteTokenSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

  
      App.contracts.CelesteToken.deployed().then(function(instance) {
        CelesteTokenInstance = instance;
        return CelesteTokenInstance.balanceOf(App.account);
      }).then(function(balance) {
        $('.Celeste-balance').html(balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    App.contracts.CelesteTokenSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') 
      
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});

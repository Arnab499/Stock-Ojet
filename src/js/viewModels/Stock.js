define(['../accUtils', 'knockout', 'ojs/ojchart'],
  function (accUtils, ko) {
    function StockViewModel() {
      var self = this;
  
      // Data
      self.stocks = ko.observableArray([]);
      self.isAdmin = ko.observable(false);
      self.isCustomer = ko.observable(false);
      self.userId = ko.observable('');
  
      // UI state
      self.stockKeys = ko.observableArray([]);
      self.showDeleteActions = ko.observable(false);
      self.showAddForm = ko.observable(false);
      self.showUpdateActions = ko.observable(false);
      self.showTrends = ko.observable(false);
      self.editingStockId = ko.observable(null);
      self.liststk = ko.observable(false);
  
      // For Buy UI
      self.showBuyForm = ko.observable(false);
      self.buyStockObj = ko.observable({});
      self.buyQty = ko.observable(1); // default to 1
  
      // Add form observables
      self.addStockId = ko.observable();
      self.addStockName = ko.observable();
      self.addStockPrice = ko.observable();
      self.addStockVolume = ko.observable();
      self.addListingPrice = ko.observable();
      self.addListedDate = ko.observable();
      self.addListedExchange = ko.observable();
  
      // Chart observables
      self.chartGroups = ko.observableArray([]);
      self.chartSeries = ko.observableArray([]);
  
      // --------------- ADMIN/CUSTOMER ROLE ---------------
      self.setRole = function() {
        var role = sessionStorage.getItem('role');
        var userId = sessionStorage.getItem('userId');
        self.isAdmin(role === "ADMIN");
        self.isCustomer(role === "CUSTOMER");
        self.userId(userId);
      };
  
      // --------------- CHART ---------------
      self._buildChart = () => {
        const data = self.stocks() || [];
        const groups = data.map(s => s.stockName || s.stockId);
        const listing = [];
        const current = [];
        data.forEach(d => {
          const lp = Number(d.listingPrice);
          const sp = Number(d.stockPrice);
          listing.push(Number.isFinite(lp) ? lp : 0);
          current.push(Number.isFinite(sp) ? sp : 0);
        });
        self.chartGroups(groups);
        self.chartSeries([
          { name: 'Listing Price', items: listing },
          { name: 'Stock Price', items: current }
        ]);
      };
      self.stocks.subscribe(self._buildChart);
  
      // ----------------- ADMIN: ADD STOCK -----------------
      self.addStock = function () {
        self.showTrends(false);
        self.showDeleteActions(false);
        self.showAddForm(true);
        self.showUpdateActions(false);
        self.showTrends(false);
        self.liststk(false);
        self.addStockId('');
        self.addStockName('');
        self.addStockPrice('');
        self.addStockVolume('');
        self.addListingPrice('');
        self.addListedDate('');
        self.addListedExchange('');
      };
  
      self.confirmAddStock = function () {
        const stockObj = {
          stockId: self.addStockId(),
          stockName: self.addStockName(),
          stockPrice: parseFloat(self.addStockPrice()),
          stockVolume: self.addStockVolume(),
          listingPrice: parseFloat(self.addListingPrice()),
          listedDate: self.addListedDate(),
          listedExchange: self.addListedExchange()
        };
        fetch('http://localhost:8080/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stockObj)
        })
          .then(r => {
            if (r.status === 201) {
              alert('Stock added!');
              self.showAddForm(false);
              self.listStock();
            } else if (r.status === 409) {
              alert('Stock already exists with this ID.');
            } else {
              r.text().then(txt => alert('Add failed: ' + txt));
            }
          })
          .catch(() => alert('Add failed!'));
      };
  
      // ----------------- ADMIN: DELETE -----------------
      self.delStock = function () {
        self.showDeleteTable();
      };
  
      self.showDeleteTable = function () {
        self.showTrends(false);
        self.showAddForm(false);
        self.showDeleteActions(true);
        self.showUpdateActions(false);
        self.showTrends(false);
        self.liststk(false);
        fetch('http://localhost:8080/stocks')
          .then(r => r.json())
          .then(data => self.stocks(Array.isArray(data) ? data : []))
          .catch(() => self.stocks([]));
      };
  
      self.deleteByRow = function (stock) {
        if (!confirm(`Delete stock with ID ${stock.stockId}?`)) return;
        fetch('http://localhost:8080/stocks/' + stock.stockId, {
          method: 'DELETE'
        })
          .then(response => {
            if (response.ok) {
              alert("Stock deleted successfully");
              self.showDeleteTable();
            } else if (response.status === 404) {
              alert("Stock not found");
            } else {
              alert("Failed to delete stock");
            }
          })
          .catch(error => {
            alert("Error deleting stock");
            console.error(error);
          });
      };
  
      // ----------------- ADMIN/CUST: LIST -----------------
      self.listStock = function () {
        self.showAddForm(false);
        self.liststk(true);
        self.showTrends(false);
        self.showDeleteActions(false);
        self.showUpdateActions(false);
        self.showTrends(false);
        fetch("http://localhost:8080/stocks")
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            self.stocks(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            console.error("Error fetching stocks:", error);
            alert("Failed to load stocks");
            self.stocks([]);
          });
      };
  
      // --------------- CHART ---------------
      self.showTrendsChart = function () {
        self.showAddForm(false);
        self.liststk(false);
        self.showDeleteActions(false);
        self.showUpdateActions(false);
        self.showTrends(true);
        fetch("http://localhost:8080/stocks")
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            self.stocks(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            console.error("Error fetching stocks for chart:", error);
            alert("Failed to load stock trends");
            self.stocks([]);
          });
      };
  
      // ----------------- ADMIN: UPDATE -----------------
      self.editTemp = {
        stockName: ko.observable(),
        stockPrice: ko.observable(),
        stockVolume: ko.observable(),
        listingPrice: ko.observable(),
        listedDate: ko.observable(),
        listedExchange: ko.observable()
      };
  
      self.updateStock = function () {
        self.showAddForm(false);
        self.liststk(false);
        self.showTrends(false);
        self.showDeleteActions(false);
        self.showUpdateActions(true);
        self.showTrends(false);
        self.editingStockId(null);
        fetch("http://localhost:8080/stocks")
          .then(response => response.json())
          .then(data => self.stocks(Array.isArray(data) ? data : []))
          .catch(() => self.stocks([]));
      };
  
      self.editStockRow = function (stock) {
        self.editingStockId(stock.stockId);
        self.editTemp.stockName(stock.stockName);
        self.editTemp.stockPrice(stock.stockPrice);
        self.editTemp.stockVolume(stock.stockVolume);
        self.editTemp.listingPrice(stock.listingPrice);
        self.editTemp.listedDate(stock.listedDate);
        self.editTemp.listedExchange(stock.listedExchange);
      };
  
      self.confirmEditStock = function (stock) {
        const id = stock.stockId;
        const updated = {
          stockId: id,
          stockName: self.editTemp.stockName(),
          stockPrice: parseFloat(self.editTemp.stockPrice()),
          stockVolume: self.editTemp.stockVolume(),
          listingPrice: parseFloat(self.editTemp.listingPrice()),
          listedDate: self.editTemp.listedDate(),
          listedExchange: self.editTemp.listedExchange()
        };
        fetch('http://localhost:8080/stocks/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
          .then(r => {
            if (r.ok) {
              alert('Stock updated!');
              self.editingStockId(null);
              self.updateStock();
            } else if (r.status === 404) {
              alert('Stock not found.');
            } else {
              r.text().then(txt => alert('Update failed: ' + txt));
            }
          })
          .catch(() => alert('Update failed!'));
      };
  
      self.cancelEditStock = function () {
        self.editingStockId(null);
      };
  
      // ----------------- CUSTOMER: BUY STOCK -----------------
      self.buyStock = function (stock) {
        self.buyStockObj(stock);
        self.buyQty(1);
        self.showBuyForm(true);
      };
  
      self.confirmBuy = function () {
        var currentStock = self.buyStockObj();
        var buyQtyNum = parseInt(self.buyQty(), 10);

        // Check for sufficient volume
        if (buyQtyNum < 1 || buyQtyNum > parseInt(currentStock.stockVolume, 10)) {
          alert("Invalid quantity!");
          return;
        }

        var txn = {
          custId: self.userId(),
          stockId: currentStock.stockId,
          txnPrice: currentStock.stockPrice,
          txnType: "BUY",
          qty: buyQtyNum,
          txnDate: (new Date()).toISOString().substring(0, 10)
        };

        // 1. POST transaction
        fetch('http://localhost:8080/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txn)
        })
        .then(r => {
          if (r.status === 201) {
            // 2. PUT: update stock volume
            var newVol = parseInt(currentStock.stockVolume, 10) - buyQtyNum;
            fetch('http://localhost:8080/stocks/' + currentStock.stockId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(Object.assign({}, currentStock, {
                stockVolume: newVol
              }))
            })
            .then(() => {
              alert('Purchase successful!');
              self.showBuyForm(false);
              self.listStock(); // refresh the stock list for all users
            });
          } else {
            r.text().then(txt => alert('Buy failed: ' + txt));
          }
        })
        .catch(err => alert('Buy failed!'));
      };
  
      self.cancelBuy = function () {
        self.showBuyForm(false);
      };
  
      // --------------- LIFECYCLE ---------------
      self.connected = () => {
        accUtils.announce('Stock page loaded.', 'assertive');
        document.title = "Stock";
        self.setRole();
        self.showTrendsChart();
      };
      self.disconnected = () => {};
      self.transitionCompleted = () => {};
    }
    return StockViewModel;
  }
);
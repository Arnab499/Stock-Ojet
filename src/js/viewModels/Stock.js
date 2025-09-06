define(['../accUtils', 'knockout', 'ojs/ojchart'],
  function (accUtils, ko) {
    function StockViewModel() {
      // Data
      this.stocks = ko.observableArray([]);

      // UI state
      this.stockKeys = ko.observableArray([]);
      this.showDeleteActions = ko.observable(false);
      this.showAddForm = ko.observable(false);
      this.showUpdateActions = ko.observable(false);
      this.showTrends = ko.observable(false); // NEW: controls chart visibility
      this.editingStockId = ko.observable(null);
      this.liststk=ko.observable(false);
      

      // Add form observables
      this.addStockId = ko.observable();
      this.addStockName = ko.observable();
      this.addStockPrice = ko.observable();
      this.addStockVolume = ko.observable();
      this.addListingPrice = ko.observable();
      this.addListedDate = ko.observable();
      this.addListedExchange = ko.observable();

      // Chart observables
      this.chartGroups = ko.observableArray([]);
      this.chartSeries = ko.observableArray([]);

      // Build chart series/groups from stocks
      this._buildChart = () => {
        const data = this.stocks() || [];
        const groups = data.map(s => s.stockName || s.stockId);
        const listing = [];
        const current = [];

        data.forEach(d => {
          const lp = Number(d.listingPrice);
          const sp = Number(d.stockPrice);
          listing.push(Number.isFinite(lp) ? lp : 0);
          current.push(Number.isFinite(sp) ? sp : 0);
        });

        this.chartGroups(groups);
        this.chartSeries([
          { name: 'Listing Price', items: listing },
          { name: 'Stock Price', items: current }
        ]);
      };

      // Keep chart in sync whenever stocks change
      this.stocks.subscribe(this._buildChart);

      // Actions
      this.addStock = function () {
        this.showTrends(false);
        this.showDeleteActions(false);
        this.showAddForm(true);
        this.showUpdateActions(false);
        this.showTrends(false);
        this.liststk(false);
        this.addStockId('');
        this.addStockName('');
        this.addStockPrice('');
        this.addStockVolume('');
        this.addListingPrice('');
        this.addListedDate('');
        this.addListedExchange('');
      }.bind(this);

      this.confirmAddStock = function () {
        const stockObj = {
          stockId: this.addStockId(),
          stockName: this.addStockName(),
          stockPrice: parseFloat(this.addStockPrice()),
          stockVolume: this.addStockVolume(),
          listingPrice: parseFloat(this.addListingPrice()),
          listedDate: this.addListedDate(),
          listedExchange: this.addListedExchange()
        };

        fetch('http://localhost:8080/stocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stockObj)
        })
          .then(r => {
            if (r.status === 201) {
              alert('Stock added!');
              this.showAddForm(false);
              this.listStock();
            } else if (r.status === 409) {
              alert('Stock already exists with this ID.');
            } else {
              r.text().then(txt => alert('Add failed: ' + txt));
            }
          })
          .catch(() => alert('Add failed!'));
      }.bind(this);

      this.delStock = function () {
        this.showDeleteTable();
      }.bind(this);

      this.showDeleteTable = function () {
        this.showTrends(false);
        this.showAddForm(false);
        this.showDeleteActions(true);
        this.showUpdateActions(false);
        this.showTrends(false);
        this.liststk(false);
        fetch('http://localhost:8080/stocks')
          .then(r => r.json())
          .then(data => this.stocks(Array.isArray(data) ? data : []))
          .catch(() => this.stocks([]));
      }.bind(this);

      this.deleteByRow = function (stock) {
        if (!confirm(`Delete stock with ID ${stock.stockId}?`)) return;
        fetch('http://localhost:8080/stocks/' + stock.stockId, {
          method: 'DELETE'
        })
          .then(response => {
            if (response.ok) {
              alert("Stock deleted successfully");
              this.showDeleteTable();
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
      }.bind(this);

      this.listStock = function () {
        this.liststk(true);
        this.showTrends(false);
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(false);
        this.showTrends(false);
        fetch("http://localhost:8080/stocks")
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            this.stocks(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            console.error("Error fetching stocks:", error);
            alert("Failed to load stocks");
            this.stocks([]);
          });
      }.bind(this);

      // NEW: Show Trends Chart
      this.showTrendsChart = function () {
        this.liststk(false);
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(false);
        this.showTrends(true);
        fetch("http://localhost:8080/stocks")
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            this.stocks(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            console.error("Error fetching stocks for chart:", error);
            alert("Failed to load stock trends");
            this.stocks([]);
          });
      }.bind(this);

      // Edit support
      this.editTemp = {
        stockName: ko.observable(),
        stockPrice: ko.observable(),
        stockVolume: ko.observable(),
        listingPrice: ko.observable(),
        listedDate: ko.observable(),
        listedExchange: ko.observable()
      };

      this.updateStock = function () {
        this.liststk(false);
        this.showTrends(false);
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(true);
        this.showTrends(false);
        this.editingStockId(null);
        fetch("http://localhost:8080/stocks")
          .then(response => response.json())
          .then(data => this.stocks(Array.isArray(data) ? data : []))
          .catch(() => this.stocks([]));
      }.bind(this);

      this.editStockRow = function (stock) {
        this.editingStockId(stock.stockId);
        this.editTemp.stockName(stock.stockName);
        this.editTemp.stockPrice(stock.stockPrice);
        this.editTemp.stockVolume(stock.stockVolume);
        this.editTemp.listingPrice(stock.listingPrice);
        this.editTemp.listedDate(stock.listedDate);
        this.editTemp.listedExchange(stock.listedExchange);
      }.bind(this);

      this.confirmEditStock = function (stock) {
        const id = stock.stockId;
        const updated = {
          stockId: id,
          stockName: this.editTemp.stockName(),
          stockPrice: parseFloat(this.editTemp.stockPrice()),
          stockVolume: this.editTemp.stockVolume(),
          listingPrice: parseFloat(this.editTemp.listingPrice()),
          listedDate: this.editTemp.listedDate(),
          listedExchange: this.editTemp.listedExchange()
        };
        fetch('http://localhost:8080/stocks/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
          .then(r => {
            if (r.ok) {
              alert('Stock updated!');
              this.editingStockId(null);
              this.updateStock();
            } else if (r.status === 404) {
              alert('Stock not found.');
            } else {
              r.text().then(txt => alert('Update failed: ' + txt));
            }
          })
          .catch(() => alert('Update failed!'));
      }.bind(this);

      this.cancelEditStock = function () {
        this.editingStockId(null);
      }.bind(this);

        this.connected = () => {
            accUtils.announce('Stock page loaded.', 'assertive');
            document.title = "Stock";
            this.showTrendsChart(); 
        };

      this.disconnected = () => {};
      this.transitionCompleted = () => {};
    }

    return StockViewModel;
  }
);

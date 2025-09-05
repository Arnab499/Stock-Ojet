define(['../accUtils','knockout','ojs/ojconverter-number'],
 function(accUtils,ko,NumberConverter) {
    function StockViewModel() {

        // this.priceConverter = new NumberConverter.IntlNumberConverter({
        //     style: 'decimal',
        //     minimumFractionDigits: 2,
        //     maximumFractionDigits: 2
        // });

        this.stocks = ko.observableArray([]);
        this.stockKeys = ko.observableArray([]);
        this.showDeleteActions = ko.observable(false);
        this.showAddForm = ko.observable(false);
        this.showUpdateActions = ko.observable(false); 
        this.editingStockId = ko.observable(null); 

        this.addStockId = ko.observable();
        this.addStockName = ko.observable();
        this.addStockPrice = ko.observable();
        this.addStockVolume = ko.observable();
        this.addListingPrice = ko.observable();
        this.addListedDate = ko.observable();
        this.addListedExchange = ko.observable();
        this.addStock = function () {
            this.showDeleteActions(false);
            this.showAddForm(true);
            this.addStockId('');
            this.addStockName('');
            this.addStockPrice('');
            this.addStockVolume('');
            this.addListingPrice('');
            this.addListedDate('');
            this.addListedExchange('');
        }.bind(this);

        this.confirmAddStock = function () {
            var stockObj = {
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
                .catch(e => alert('Add failed!'));
        }.bind(this);


        this.delStock = function () {
            this.showDeleteTable();
        }.bind(this);

        this.showDeleteTable = function () {
            this.showAddForm(false);
            this.showDeleteActions(true);
            this.showUpdateActions(false);
            fetch('http://localhost:8080/stocks')
                .then(r => r.json())
                .then(data => this.stocks(Array.isArray(data) ? data : []));
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
            this.showAddForm(false);
            this.showDeleteActions(false);
            this.showUpdateActions(false);
            fetch("http://localhost:8080/stocks") // adjust endpoint if needed
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Network response was not ok");
                    }
                    return response.json();
                })
                .then(data => {
                    this.stocks(data);
                })
                .catch(error => {
                    console.error("Error fetching stocks:", error);
                    alert("Failed to load stocks");
                });
        }.bind(this);

        this.editTemp = {
            stockName: ko.observable(),
            stockPrice: ko.observable(),
            stockVolume: ko.observable(),
            listingPrice: ko.observable(),
            listedDate: ko.observable(),
            listedExchange: ko.observable()
        };

        this.updateStock = function () {
            this.showAddForm(false);
            this.showDeleteActions(false);
            this.showUpdateActions(true);
            this.editingStockId(null); 
            fetch("http://localhost:8080/stocks")
                .then(response => response.json())
                .then(data => this.stocks(data));
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
            var id = stock.stockId;
            var updated = {
                stockId: id,
                stockName: this.editTemp.stockName(),
                stockPrice: this.editTemp.stockPrice(),
                stockVolume: this.editTemp.stockVolume(),
                listingPrice: this.editTemp.listingPrice(),
                listedDate: this.editTemp.listedDate(),
                listedExchange: this.editTemp.listedExchange()
            };
            fetch('http://localhost:8080/stocks/' + id, {
                method: 'PUT', // or 'PATCH' for partial
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            })
                .then(r => {
                    if (r.ok) {
                        alert('Stock updated!');
                        this.editingStockId(null);
                        this.updateStock(); // refresh table
                    } else if (r.status === 404) {
                        alert('Stock not found.');
                    } else {
                        r.text().then(txt => alert('Update failed: ' + txt));
                    }
                })
                .catch(e => alert('Update failed!'));
        }.bind(this);

        this.cancelEditStock = function () {
            this.editingStockId(null); // Exit edit mode (restores text display)
        }.bind(this);

      
       
      this.connected = () => {
        accUtils.announce('Stock page loaded.', 'assertive');
        document.title = "Stock";
        // Implement further logic if needed
      };

      /**
       * Optional ViewModel method invoked after the View is disconnected from the DOM.
       */
      this.disconnected = () => {
        // Implement if needed
      };

      /**
       * Optional ViewModel method invoked after transition to the new View is complete.
       * That includes any possible animation between the old and the new View.
       */
      this.transitionCompleted = () => {
        // Implement if needed
      };
    }

   
    return StockViewModel;
  }
);

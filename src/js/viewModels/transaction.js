define(['../accUtils', 'knockout'],
  function (accUtils, ko) {
    function TransactionViewModel() {
      // Data
      this.transactions = ko.observableArray([]);

      // UI state
      this.showAddForm = ko.observable(false);
      this.showDeleteActions = ko.observable(false);
      this.showUpdateActions = ko.observable(false);
      this.listTxnTable = ko.observable(true);
      this.editingTxnId = ko.observable(null);

      // Add form observables
      this.addTxnId = ko.observable();
      this.addCustId = ko.observable();
      this.addStockId = ko.observable();
      this.addTxnPrice = ko.observable();
      this.addTxnType = ko.observable();
      this.addQty = ko.observable();
      this.addTxnDate = ko.observable();

      // Edit form temp
      this.editTemp = {
        custId: ko.observable(),
        stockId: ko.observable(),
        txnPrice: ko.observable(),
        txnType: ko.observable(),
        qty: ko.observable(),
        txnDate: ko.observable()
      };

      // List transactions
      this.listTransaction = function () {
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(false);
        this.listTxnTable(true);
        fetch("http://localhost:8080/transactions")
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            this.transactions(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            console.error("Error fetching transactions:", error);
            alert("Failed to load transactions");
            this.transactions([]);
          });
      }.bind(this);

      // Add
      this.addTransaction = function () {
        this.showAddForm(true);
        this.showDeleteActions(false);
        this.showUpdateActions(false);
        this.listTxnTable(false);
        this.addTxnId('');
        this.addCustId('');
        this.addStockId('');
        this.addTxnPrice('');
        this.addTxnType('');
        this.addQty('');
        this.addTxnDate('');
      }.bind(this);

      this.confirmAddTransaction = function () {
        const txnObj = {
          txnId: this.addTxnId(),
          custId: this.addCustId(),
          stockId: this.addStockId(),
          txnPrice: parseFloat(this.addTxnPrice()),
          txnType: this.addTxnType(),
          qty: parseInt(this.addQty()),
          txnDate: this.addTxnDate()
        };
        fetch('http://localhost:8080/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txnObj)
        })
          .then(r => {
            if (r.status === 201) {
              alert('Transaction added!');
              this.showAddForm(false);
              this.listTransaction();
            } else if (r.status === 409) {
              alert('Transaction already exists with this ID.');
            } else {
              r.text().then(txt => alert('Add failed: ' + txt));
            }
          })
          .catch(() => alert('Add failed!'));
      }.bind(this);

      // Delete
      this.delTransaction = function () {
        this.showAddForm(false);
        this.showDeleteActions(true);
        this.showUpdateActions(false);
        this.listTxnTable(false);
        fetch("http://localhost:8080/transactions")
          .then(response => response.json())
          .then(data => this.transactions(Array.isArray(data) ? data : []))
          .catch(() => this.transactions([]));
      }.bind(this);

      this.deleteByRow = function (txn) {
        if (!confirm(`Delete transaction with ID ${txn.txnId}?`)) return;
        fetch('http://localhost:8080/transactions/' + txn.txnId, {
          method: 'DELETE'
        })
          .then(response => {
            if (response.ok) {
              alert("Transaction deleted successfully");
              this.delTransaction();
            } else if (response.status === 404) {
              alert("Transaction not found");
            } else {
              alert("Failed to delete transaction");
            }
          })
          .catch(error => {
            alert("Error deleting transaction");
            console.error(error);
          });
      }.bind(this);

      // Update
      this.updateTransaction = function () {
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(true);
        this.listTxnTable(false);
        this.editingTxnId(null);
        fetch("http://localhost:8080/transactions")
          .then(response => response.json())
          .then(data => this.transactions(Array.isArray(data) ? data : []))
          .catch(() => this.transactions([]));
      }.bind(this);

      this.editTxnRow = function (txn) {
        this.editingTxnId(txn.txnId);
        this.editTemp.custId(txn.custId);
        this.editTemp.stockId(txn.stockId);
        this.editTemp.txnPrice(txn.txnPrice);
        this.editTemp.txnType(txn.txnType);
        this.editTemp.qty(txn.qty);
        this.editTemp.txnDate(txn.txnDate);
      }.bind(this);

      this.confirmEditTransaction = function (txn) {
        const id = txn.txnId;
        const updated = {
          txnId: id,
          custId: this.editTemp.custId(),
          stockId: this.editTemp.stockId(),
          txnPrice: parseFloat(this.editTemp.txnPrice()),
          txnType: this.editTemp.txnType(),
          qty: parseInt(this.editTemp.qty()),
          txnDate: this.editTemp.txnDate()
        };
        fetch('http://localhost:8080/transactions/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
          .then(r => {
            if (r.ok) {
              alert('Transaction updated!');
              this.editingTxnId(null);
              this.updateTransaction();
            } else if (r.status === 404) {
              alert('Transaction not found.');
            } else {
              r.text().then(txt => alert('Update failed: ' + txt));
            }
          })
          .catch(() => alert('Update failed!'));
      }.bind(this);

      this.cancelEditTransaction = function () {
        this.editingTxnId(null);
      }.bind(this);

      // Lifecycle
      this.connected = () => {
        accUtils.announce('Transactions page loaded.', 'assertive');
        document.title = "Transactions";
        this.listTransaction();
      };
      this.disconnected = () => {};
      this.transitionCompleted = () => {};
    }

    return TransactionViewModel;
  }
);
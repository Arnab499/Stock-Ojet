define(['../accUtils', 'knockout'],
  function (accUtils, ko) {
    function CustomerViewModel() {
      // Observables for managing customers and UI state
      this.customers = ko.observableArray([]);
      this.showAddForm = ko.observable(false);
      this.showDeleteActions = ko.observable(false);
      this.showUpdateActions = ko.observable(false);
      this.listCustTable = ko.observable(true);
      this.editingCustId = ko.observable(null);

      // Add form observables
      this.addCustId = ko.observable();
      this.addFirstName = ko.observable();
      this.addLastName = ko.observable();
      this.addPhoneNumber = ko.observable();
      this.addCity = ko.observable();
      this.addEmailId = ko.observable();

      // Edit form temporary observables
      this.editTemp = {
        firstName: ko.observable(),
        lastName: ko.observable(),
        phoneNumber: ko.observable(),
        city: ko.observable(),
        emailId: ko.observable()
      };

      // List customers
      this.listCust = function () {
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(false);
        this.listCustTable(true);
        fetch("http://localhost:8080/customers")
          .then(response => {
            if (!response.ok) throw new Error("Network response was not ok");
            return response.json();
          })
          .then(data => {
            this.customers(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            console.error("Error fetching customers:", error);
            alert("Failed to load customers");
            this.customers([]);
          });
      }.bind(this);

      // Add Customer Actions
      this.addCust = function () {
        this.showAddForm(true);
        this.showDeleteActions(false);
        this.showUpdateActions(false);
        this.listCustTable(false);
        this.addCustId('');
        this.addFirstName('');
        this.addLastName('');
        this.addPhoneNumber('');
        this.addCity('');
        this.addEmailId('');
      }.bind(this);

      this.confirmAddCust = function () {
        const custObj = {
          custId: this.addCustId(),
          firstName: this.addFirstName(),
          lastName: this.addLastName(),
          phoneNumber: this.addPhoneNumber(),
          city: this.addCity(),
          emailId: this.addEmailId()
        };
        fetch('http://localhost:8080/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(custObj)
        })
          .then(r => {
            if (r.status === 201) {
              alert('Customer added!');
              this.showAddForm(false);
              this.listCust();
            } else if (r.status === 409) {
              alert('Customer already exists with this ID.');
            } else {
              r.text().then(txt => alert('Add failed: ' + txt));
            }
          })
          .catch(() => alert('Add failed!'));
      }.bind(this);

      // Delete Customer Actions
      this.delCust = function () {
        this.showAddForm(false);
        this.showDeleteActions(true);
        this.showUpdateActions(false);
        this.listCustTable(false);
        fetch('http://localhost:8080/customers')
          .then(r => r.json())
          .then(data => this.customers(Array.isArray(data) ? data : []))
          .catch(() => this.customers([]));
      }.bind(this);

      this.deleteByRow = function (customer) {
        if (!confirm(`Delete customer with ID ${customer.custId}?`)) return;
        fetch('http://localhost:8080/customers/' + customer.custId, {
          method: 'DELETE'
        })
          .then(response => {
            if (response.ok) {
              alert("Customer deleted successfully");
              this.delCust();
            } else if (response.status === 404) {
              alert("Customer not found");
            } else {
              alert("Failed to delete customer");
            }
          })
          .catch(error => {
            alert("Error deleting customer");
            console.error(error);
          });
      }.bind(this);

      // Update Customer Actions
      this.updateCust = function () {
        this.showAddForm(false);
        this.showDeleteActions(false);
        this.showUpdateActions(true);
        this.listCustTable(false);
        this.editingCustId(null);
        fetch("http://localhost:8080/customers")
          .then(response => response.json())
          .then(data => this.customers(Array.isArray(data) ? data : []))
          .catch(() => this.customers([]));
      }.bind(this);

      this.editCustRow = function (customer) {
        this.editingCustId(customer.custId);
        this.editTemp.firstName(customer.firstName);
        this.editTemp.lastName(customer.lastName);
        this.editTemp.phoneNumber(customer.phoneNumber);
        this.editTemp.city(customer.city);
        this.editTemp.emailId(customer.emailId);
      }.bind(this);

      this.confirmEditCust = function (customer) {
        const id = customer.custId;
        const updated = {
          custId: id,
          firstName: this.editTemp.firstName(),
          lastName: this.editTemp.lastName(),
          phoneNumber: this.editTemp.phoneNumber(),
          city: this.editTemp.city(),
          emailId: this.editTemp.emailId()
        };
        fetch('http://localhost:8080/customers/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        })
          .then(r => {
            if (r.ok) {
              alert('Customer updated!');
              this.editingCustId(null);
              this.updateCust();
            } else if (r.status === 404) {
              alert('Customer not found.');
            } else {
              r.text().then(txt => alert('Update failed: ' + txt));
            }
          })
          .catch(() => alert('Update failed!'));
      }.bind(this);

      this.cancelEditCust = function () {
        this.editingCustId(null);
      }.bind(this);

      // Lifecycle
      this.connected = () => {
        accUtils.announce('Customers page loaded.', 'assertive');
        document.title = "Customers";
        this.listCust();
      };
      this.disconnected = () => {};
      this.transitionCompleted = () => {};
    }

    return CustomerViewModel;
  }
);
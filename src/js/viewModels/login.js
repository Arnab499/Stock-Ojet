define(['knockout'], function (ko) {
  function LoginViewModel() {
    var self = this;
    self.email = ko.observable();
    self.password = ko.observable();
    self.errorMsg = ko.observable(); 
self.email.subscribe(function () { self.errorMsg(''); });
self.password.subscribe(function () { self.errorMsg(''); });

self.login = function () {
  var email = self.email();
  var password = self.password();
  var isValid = false;
  var response = {};

  // Hardcoded users
  if (email === "admin@example.com" && password === "admin123") {
    isValid = true;
    response = { token: "dummy-admin-jwt", role: "ADMIN", userId: "adminId" };
  } else if (email === "customer@example.com" && password === "cust123") {
    isValid = true;
    response = { token: "dummy-customer-jwt", role: "CUSTOMER", userId: "customerId" };
  }

  if (isValid) {
    sessionStorage.setItem('jwt', response.token);
    sessionStorage.setItem('role', response.role);
    sessionStorage.setItem('userId', response.userId);

    // Use the CoreRouter instance from appController
    require(['appController'], function (appController) {
      appController.updateNavForRole();
      appController.setUserInfo(self.email());
      // Navigate via CoreRouter
      appController.router.go({ path: 'Stock' });
    });
  } else {
    self.errorMsg('Invalid email or password.');
  }
};

  }
  return new LoginViewModel();
}); 
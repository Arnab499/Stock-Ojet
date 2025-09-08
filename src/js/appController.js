define(['knockout', 'ojs/ojcontext', 'ojs/ojmodule-element-utils', 'ojs/ojknockouttemplateutils',
  'ojs/ojcorerouter', 'ojs/ojmodulerouter-adapter', 'ojs/ojknockoutrouteradapter', 'ojs/ojurlparamadapter',
  'ojs/ojresponsiveutils', 'ojs/ojresponsiveknockoututils', 'ojs/ojarraydataprovider',
  'ojs/ojdrawerpopup', 'ojs/ojmodule-element', 'ojs/ojknockout'],
  function (ko, Context, moduleUtils, KnockoutTemplateUtils, CoreRouter, ModuleRouterAdapter,
    KnockoutRouterAdapter, UrlParamAdapter, ResponsiveUtils, ResponsiveKnockoutUtils, ArrayDataProvider) {

    function ControllerViewModel() {
      var self = this;

      this.KnockoutTemplateUtils = KnockoutTemplateUtils;

      // Announcements for accessibility
      this.manner = ko.observable('polite');
      this.message = ko.observable();
      var announcementHandler = (event) => {
        this.message(event.detail.message);
        this.manner(event.detail.manner);
      };
      document.getElementById('globalBody').addEventListener('announce', announcementHandler, false);

      // Media queries for responsive layouts
      const smQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.SM_ONLY);
      this.smScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(smQuery);
      const mdQuery = ResponsiveUtils.getFrameworkQuery(ResponsiveUtils.FRAMEWORK_QUERY_KEY.MD_UP);
      this.mdScreen = ResponsiveKnockoutUtils.createMediaQueryObservable(mdQuery);

      /** 1. Router main navData contains ALL routes registered */
      var navData = [
        { path: '', redirect: 'login' }, // default route is login
        { path: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-login' } },
        { path: 'Stock', detail: { label: 'Stock', iconClass: 'oj-ux-ico-bar-chart' } },
        { path: 'customers', detail: { label: 'Customers', iconClass: 'oj-ux-ico-contact-group' } },
        { path: 'transaction', detail: { label: 'Transactions', iconClass: 'oj-ux-ico-fire' } },
        { path: 'about', detail: { label: 'About', iconClass: 'oj-ux-ico-information-s' } }
      ];

      /** 2. Create the router on ALL route states */
      this.router = new CoreRouter(navData, { urlAdapter: new UrlParamAdapter() });
      this.moduleAdapter = new ModuleRouterAdapter(this.router);
      this.selection = new KnockoutRouterAdapter(this.router);

      /** 3. Navigation is only for visible tabs (based on role) */
      this.navDataArray = ko.observableArray([]);
      this.navDataProvider = new ArrayDataProvider(this.navDataArray, { keyAttributes: "path" });

      /** 4. Role-based tab rendering (do NOT unregister routes) */
      this.updateNavForRole = function () {
        var role = sessionStorage.getItem('role');
        if (role === 'ADMIN') {
          self.navDataArray([
            { path: 'Stock', detail: { label: 'Stock', iconClass: 'oj-ux-ico-bar-chart' } },
            { path: 'customers', detail: { label: 'Customers', iconClass: 'oj-ux-ico-contact-group' } },
            { path: 'transaction', detail: { label: 'Transactions', iconClass: 'oj-ux-ico-fire' } },
            { path: 'about', detail: { label: 'About', iconClass: 'oj-ux-ico-information-s' } }
          ]);
        } else if (role === 'CUSTOMER') {
          self.navDataArray([
            { path: 'Stock', detail: { label: 'Stock', iconClass: 'oj-ux-ico-bar-chart' } },
            { path: 'transaction', detail: { label: 'Dashboard', iconClass: 'oj-ux-ico-fire' } },
            { path: 'about', detail: { label: 'About', iconClass: 'oj-ux-ico-information-s' } }
          ]);
        } else {
          self.navDataArray([
            { path: 'login', detail: { label: 'Login', iconClass: 'oj-ux-ico-login' } }
          ]);
        }
      };

      // Initial navigation setup (might be before any login)
      this.updateNavForRole();

      /** 5. Drawer handling */
      this.sideDrawerOn = ko.observable(false);
      this.mdScreen.subscribe(() => { self.sideDrawerOn(false); });
      this.toggleDrawer = () => {
        self.sideDrawerOn(!self.sideDrawerOn());
      };

      // Application Name and User Info
      this.appName = ko.observable("Stock Manager");
      this.userLogin = ko.observable("");

      // Update user login name on login
      this.setUserInfo = function (email) {
        self.userLogin(email);
      };

      /** 6. Route Guard: Use currentState.subscribe() */
      this.router.currentState.subscribe(function (args) {
        // Only allow login to be accessed if not logged in
        if (!sessionStorage.getItem('jwt') && args.state && args.state.id !== 'login') {
          self.router.go('login');
        }
        // Block customers page for non-admins (even if nav is hidden, users can still enter URL manually)
        if (args.state && args.state.id === 'customers') {
          var role = sessionStorage.getItem('role');
          if (role !== 'ADMIN') {
            self.router.go('Stock');
          }
        }
        // Optionally, you can add other route guards here...
      });

      // In your ControllerViewModel (appController.js):
      this.logout = function () {
        sessionStorage.clear();
        self.updateNavForRole();
        self.userLogin("");        // Clear displayed user
        self.router.go('login');  // Redirect to login page
      };

      // Existing code above...

      this.handleUserMenuAction = function (event) {
        let value = event.detail && event.detail.value;
        if (!value && event.originalEvent && event.originalEvent.detail && event.originalEvent.detail.value) {
          value = event.originalEvent.detail.value;
        }
        if (!value && event.target && event.target.textContent) {
          let txt = event.target.textContent.trim().toLowerCase();
          if (txt === "sign out") value = "out";
        }

        console.log('DEBUG menu action event:', event, 'RESOLVED value:', value);
        if (value === 'out') {
          self.logout();
        }
        // handle others as needed
      };

      // Start router after defining guards/listeners!
      this.router.sync();

      // release the application bootstrap busy state
      Context.getPageContext().getBusyContext().applicationBootstrapComplete();
    }

    return new ControllerViewModel();
  });
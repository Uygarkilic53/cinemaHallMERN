const sitemapService = {
  async getSiteMap() {
    return {
      home: "/",
      signup: "/signup",
      login: "/login",
      forgotPassword: "/forgot-password",
      myReservations: "/my-reservations",
      profile: "/profile",
    };
  },

  async getAdminSiteMap() {
    return {
      dashboard: "/admin/dashboard",
      manageMovies: "/admin/managemovies",
      manageHalls: "/admin/managehalls",
      manageReservations: "/admin/managereservations",
    };
  },
};

export default sitemapService;

export const getRegisterPage = (req, res) => {
  return res.render("../views/auth/register");
};

export const getLoginPage = (req, res) => {
  return res.render("auth/login");
};

exports.home = async (req, res) => {
  try {
    const locals = { title: "Home" };
    res.render("item/home", { locals });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.logout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server Error");
      }
      res.redirect("/");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.admin = async (req, res) => {
  try {
    const locals = { title: "Admin" };
    res.render("item/admin/admin", { locals });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const express = require("express");
const router = express.Router();
const { home, admin, logout } = require("../controllers/PublicController");
const { isAuthenticated, isAdmin, ensureAdmin, ensureUser } = require("../middleware/auth");
const googleauth = require("../middleware/googleAuth");
const upload = require("../config/upload");
const {
  managemodel,
  uploadArff,
  deleteArff,
  editArff,
  getModels,
  trainModel,
  toggleModel,
} = require("../controllers/ModelsController");
const {
  deleteData,
  uploadData,
  editData,
  user,
  previewFile,
  managedata,
} = require("../controllers/DataController");
const {
  submitComment,
  comment,
  getComments,
  deleteComment,
} = require("../controllers/Comment");

router.use("/auth", googleauth);

router.get("/", home);
router.get("/logout", logout);

router.get("/user", isAuthenticated, ensureUser, user);

router.get("/admin", isAuthenticated, ensureAdmin, admin);

router.get("/admin/managedata", isAuthenticated, ensureAdmin, managedata);
router.post(
  "/upload-csv",
  upload.single("file"),
  isAuthenticated, 
  ensureAdmin,
  uploadData
);
router.delete(
  "/admin/delete-csv/:filename",
  isAuthenticated, 
  ensureAdmin,
  deleteData
);
router.put("/admin/edit-csv/:filename", isAuthenticated, ensureAdmin, editData);
router.get("/preview/:filename", previewFile);

router.get("/admin/managemodel", isAuthenticated, ensureAdmin, managemodel);
router.post(
  "/upload-arff",
  upload.single("arffFile"),
  isAuthenticated, 
  ensureAdmin,
  uploadArff
);
router.delete(
  "/admin/delete-arff/:filename",
  isAuthenticated,
  ensureAdmin,
  deleteArff
);
router.put("/admin/edit-arff/:filename", isAuthenticated, ensureAdmin, editArff);

router.get("/user/getModels", isAuthenticated, ensureUser, getModels);
router.post("/user/trainModel", isAuthenticated, ensureUser, trainModel);

router.get("/admin/comment", isAuthenticated, ensureAdmin, comment);
router.get("/admin/getComments", isAuthenticated, ensureAdmin, getComments);
router.delete(
  "/admin/deleteComment/:id",
  isAuthenticated,
  ensureAdmin,
  deleteComment
);
router.post("/user/submitComment", isAuthenticated, ensureUser, submitComment);

router.post("/admin/toggle-model/:filename", isAuthenticated, ensureAdmin, toggleModel);

router.use((req, res, next) => {
  res
    .status(404)
    .send(
      '<script>alert("404 Error: The page you are looking for does not exist."); window.history.back();</script>'
    );
});

module.exports = router;
const fs = require("fs");
const csv = require("csv-parser");
const connectDB = require("../config/dbUser");
const FileData = require("../models/User");
const moment = require("moment");

async function findStudentInFileData(studentId) {
  try {
    const fileData = await FileData.findOne({
      "data.studentId": studentId,
    });

    if (fileData) {
      const student = fileData.data.find((item) => item.studentId === studentId);
      return student || null;
    }

    return null;
  } catch (err) {
    console.error("Error searching in FileData:", err);
    throw err;
  }
}

exports.managedata = async (req, res) => {
  try {
    const uploadedFiles = await FileData.find(); 
    res.render("item/admin/managedata", {
      locals: { title: "Manage Student Data" },
      uploadedFiles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.uploadData = async (req, res) => {
  try {
    const filePath = req.file.path;
    const modelName = `data_${moment().format("DDMMYYYY HH:mm:ss")}.csv`;
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("headers", (headers) => {
        console.log("CSV Headers:", headers);
      })
      .on("data", (data) => {
        const trimmedData = Object.keys(data).reduce((acc, key) => {
          acc[key.trim()] = data[key].trim();
          return acc;
        }, {});
        console.log("Trimmed Data row:", trimmedData);
        console.log("StudentID:", trimmedData["StudentID"]);
        results.push(trimmedData);
      })
      .on("end", async () => {
        try {
          await connectDB();

          // Prepare the data to store in MongoDB
          const validData = results.map((data) => ({
            studentId: data["รหัสนักศึกษา"],
            gender: data["เพศ"],
            education: data["วุฒิก่อนเข้าศึกษา"],
            grade1: data["รายวิชาวิทยาการคอมพิวเตอร์และเทคโนโลยีสารสนเทศเบื้องต้น"],
            grade2: data["รายวิชาหลักการเขียนโปรแกรมคอมพิวเตอร์"],
            grade3: data["รายวิชาระเบียบวิธีการเขียนโปรแกรม"],
            uploadedAt: new Date(),
          }));

          console.log("Valid data to store:", validData);

          const fileData = new FileData({
            filename: modelName,
            data: validData,
          });

          await fileData.save();
          fs.unlinkSync(filePath);

          res.json({ success: true, message: "อัพโหลดสำเร็จ" });
          // console.log("Data stored in MongoDB");
        } catch (err) {
          // console.error("Error storing data in MongoDB:", err);
          res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการอัพโหลด" });
        }
      });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deleteData = async (req, res) => {
  try {
    const filename = req.params.filename;

    const result = await FileData.deleteOne({ filename });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" });
    }

    res.json({ success: true, alertMessage: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการลบข้อมูล", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" });
  }
};

exports.editData = async (req, res) => {
  try {
    await connectDB();

    const { oldFilename, newFilename } = req.body;

    const fileExists = await FileData.findOne({ filename: newFilename });
    if (fileExists) {
      return res.json({ success: false, message: "ชื่อไฟล์นี้มีอยู่แล้ว" });
    }

    const result = await FileData.findOneAndUpdate(
      { filename: oldFilename },
      { filename: newFilename },
      { new: true }
    );

    if (!result) {
      console.error("ไม่พบไฟล์ในฐานข้อมูล");
      return res.status(404).json({ success: false, message: "ไม่พบไฟล์ในฐานข้อมูล" });
    }

    res.json({ success: true, message: "ปรับปรุงชื่อไฟล์สำเร็จ.", updatedFile: result });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการปรับปรุงชื่อไฟล์: ", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการปรับปรุงชื่อไฟล์" });
  }
};


exports.user = async (req, res) => {
  try {
    let studentId = req.user.emails[0].value.split("@")[0];
    if (studentId.length > 1) {
      studentId = studentId.slice(0, -1) + "-" + studentId.slice(-1);
    }

    const student = await findStudentInFileData(studentId);

    res.render("item/user/user", {
      user: {
        displayName: req.user.displayName,
        emails: req.user.emails,
        gender: student ? student.gender || "Not found" : "Not found",
        education: student ? student.education || "Not found" : "Not found",
      },
      student: student || null,
      formattedStudentId: studentId,
      locals: { title: "User", message: student ? "" : "Not found" },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.previewFile = async (req, res) => {
  try {
    const filename = req.params.filename;
    const fileData = await FileData.findOne({ filename });

    if (!fileData) {
      return res.status(404).send("File not found");
    }

    res.render("item/admin/preview", { data: fileData.data, locals: { title: "Preview File" } });
  } catch (err) {
    console.error("Error previewing file:", err);
    res.status(500).send("Server Error");
  }
};
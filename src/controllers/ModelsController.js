const fs = require("fs");
const { GridFSBucket } = require("mongodb");
const connectDB = require("../config/dbModel");
const moment = require("moment");
const path = require("path");
const { exec } = require("child_process");

exports.uploadArff = async (req, res) => {
  try {
    const filePath = req.file.path;
    const filename = `model_${moment().format("DDMMYYYY_HH.mm.ss")}.arff`;
    const uploadedAt = moment().format("D/M/YYYY HH:mm:ss");

    if (path.extname(filePath) !== ".arff") {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("เกิดข้อผิดพลาดในการลบไฟล์:", err);
      }
      return res.status(400).json({ success: false, message: "อนุญาตเฉพาะไฟล์ ARFF เท่านั้น" });
    }

    const db = await connectDB();
    const bucket = new GridFSBucket(db);

    const uploadStream = bucket.openUploadStream(filename);
    fs.createReadStream(filePath)
      .pipe(uploadStream)
      .on("finish", async () => {
        fs.unlinkSync(filePath);

        await db
          .collection("fs.files")
          .updateOne({ filename }, { $set: { uploadedAt } });

        res.json({ success: true, message: "อัปโหลดสำเร็จ" });
      })
      .on("error", (err) => {
        console.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ไปยัง GridFS:", err);
        fs.unlinkSync(filePath);
        res.json({ success: false, message: "อัปโหลดล้มเหลว" });
      });
  } catch (err) {
    console.error("ข้อผิดพลาด:", err);
    res.json({ success: false, message: "เกิดข้อผิดพลาดในการอัปโหลดโมเดล ARFF" });
  }
};

exports.deleteArff = async (req, res) => {
  try {
    const filename = req.params.filename;
    const db = await connectDB();
    const bucket = new GridFSBucket(db);
    const filesCollection = db.collection("fs.files");

    const file = await filesCollection.findOne({ filename });
    if (!file) {
      console.error(`ไม่พบไฟล์ใน GridFS: ${filename}`);
      return res.status(404).json({ success: false, message: "ไม่พบไฟล์" });
    }

    if (file.currentlyActive) {
      return res.status(400).json({ success: false, message: "ไม่สามารถลบไฟล์ที่กำลังใช้งานอยู่ได้" });
    }

    await bucket.delete(file._id);
    await filesCollection.deleteOne({ filename });

    const tempFilePath = path.join(__dirname, "../temp", `${filename}.arff`);
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`ลบไฟล์จากโฟลเดอร์ชั่วคราว: ${tempFilePath}`);
    } else {
      console.warn(`ไม่พบไฟล์ในโฟลเดอร์ชั่วคราว: ${tempFilePath}`);
    }

    res.status(200).json({ success: true, alertMessage: "ลบสำเร็จ" });
  } catch (err) {
    res.status(500).json({ success: false, message: "ลบล้มเหลว" });
  }
};

exports.editArff = async (req, res) => {
  try {
    const oldFilename = req.params.filename;
    const newFilename = req.body.newFilename;

    const db = await connectDB();
    const bucket = new GridFSBucket(db);
    const filesCollection = db.collection("fs.files");

    const existingFile = await filesCollection.findOne({ filename: newFilename });

    if (existingFile) {
      return res.status(400).json({ success: false, message: "ชื่อไฟล์ซ้ำในระบบ" });
    }

    const file = await filesCollection.findOne({ filename: oldFilename });
    if (!file) {
      return res.status(404).json({ success: false, message: "ไม่พบไฟล์" });
    }

    const tempFilePath = path.join(__dirname, "../temp", `${oldFilename}.arff`);

    const downloadStream = bucket.openDownloadStream(file._id);
    const writeStream = fs.createWriteStream(tempFilePath);

    downloadStream.pipe(writeStream);

    writeStream.on("finish", async () => {
      const uploadStream = bucket.openUploadStream(newFilename);
      fs.createReadStream(tempFilePath)
        .pipe(uploadStream)
        .on("finish", async () => {
          await bucket.delete(file._id);
          fs.unlinkSync(tempFilePath);
          res.json({ success: true, alertMessage: "แก้ไขชื่อไฟล์สำเร็จ" });
        })
        .on("error", (err) => {
          console.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์ใหม่:", err);
          res.status(500).json({ success: false, message: "ไม่สามารถเปลี่ยนชื่อไฟล์ได้" });
        });
    });

    writeStream.on("error", (err) => {
      console.error("เกิดข้อผิดพลาดระหว่างการดาวน์โหลดไฟล์:", err);
      res.status(500).json({ success: false, message: "ไม่สามารถดาวน์โหลดไฟล์ได้" });
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการแก้ไขไฟล์ ARFF:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการเปลี่ยนชื่อไฟล์" });
  }
};

exports.managemodel = async (req, res) => {
  try {
    const db = await connectDB();
    const filesCollection = db.collection("fs.files");

    const uploadedArffFiles = await filesCollection.find().toArray();
    const activeModel = await filesCollection.findOne({ currentlyActive: true });

    uploadedArffFiles.forEach((file) => {
      if (typeof file.uploadedAt === "string") {
        file.uploadedAt = moment(file.uploadedAt, "DD/MM/YYYY HH:mm:ss").toISOString();
      }
    });

    res.render("item/admin/managemodel", {
      locals: { title: "จัดการโมเดลการทำนาย" },
      uploadedFiles: uploadedArffFiles,
      activeModel: activeModel ? activeModel.filename : null,
      message: req.query.message || "",
      moment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("ข้อผิดพลาดของเซิร์ฟเวอร์");
  }
};

exports.getModels = async (req, res) => {
  try {
    const db = await connectDB();
    const filesCollection = db.collection("fs.files");

    const models = await filesCollection.find().toArray();
    res.json({ success: true, models });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการดึงโมเดล:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดึงโมเดล" });
  }
};

exports.trainModel = async (req, res) => {
  const modelFilename = req.body.modelFilename;
  let userData = [
    req.body.gender === "Male" ? 0 : 1,
    req.body.education === "Grade 12" ? 0 : req.body.education === "Vocational" ? 1 : req.body.education === "Other" ? 2 : 3,
    ...[req.body.grade1, req.body.grade2, req.body.grade3].map(grade =>
      ({ A: 0, "B+": 1, B: 1, "C+": 2, C: 2, "D+": 3, D: 3, F: 4, I: 4 , W: 4}[grade] || 1)
    )
  ];

  const tempDir = path.join(__dirname, "../temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${modelFilename}.arff`);

  try {
    const db = await connectDB();
    const bucket = new GridFSBucket(db);
    const file = await db.collection("fs.files").findOne({ filename: modelFilename });

    if (!file) {
      return res.status(404).json({ success: false, message: "ไม่พบไฟล์โมเดล" });
    }

    const downloadStream = bucket.openDownloadStream(file._id);
    let data = "";

    downloadStream.on("data", (chunk) => {
      data += chunk;
    });

    downloadStream.on("end", () => {
      fs.writeFileSync(tempFilePath, data);

      const command = `python ${path.join(__dirname, "../script.py")} ${tempFilePath} ${userData.join(" ")}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`เกิดข้อผิดพลาดในการเรียกใช้สคริปต์ Python: ${error.message}`);
          return res.status(500).json({ success: false, message: "การฝึกโมเดลล้มเหลว" });
        }

        const outputLines = stdout.trim().split("\n");
        if (outputLines.length < 5) {
          return res.status(500).json({ success: false, message: "ผลลัพธ์ที่ไม่คาดคิดจากการฝึกโมเดล" });
        }

        const [accuracy, f1Score, precision, recall, prediction] = outputLines.map(line => line.split(": ")[1]);
        res.status(200).json({ success: true, accuracy, f1Score, precision, recall, prediction });
      });
    });

    downloadStream.on("error", (err) => {
      console.error(`เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์: ${err}`);
      res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์" });
    });
  } catch (err) {
    console.error("ข้อผิดพลาด:", err);
    res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดขณะประมวลผลโมเดล" });
  }
};

exports.toggleModel = async (req, res) => {
  try {
    const filename = req.params.filename;
    const enable = req.body.enable;

    const db = await connectDB();
    const filesCollection = db.collection("fs.files");

    const file = await filesCollection.findOne({ filename });
    if (!file) {
      return res.status(404).json({ success: false, message: "ไม่พบโมเดล" });
    }

    if (enable) {
      await filesCollection.updateMany({ active: true }, { $set: { active: false } });
      await filesCollection.updateOne({ filename }, { $set: { active: true, currentlyActive: true } });

      res.json({ success: true, message: "เปิดใช้งานโมเดล" });
    } else {
      await filesCollection.updateOne({ filename }, { $set: { active: false, currentlyActive: false } });
      res.json({ success: true, message: "ปิดใช้งานโมเดล" });
    }
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะโมเดล:", err);
    res.status(500).json({ success: false, message: "ไม่สามารถเปลี่ยนสถานะโมเดลได้" });
  }
};

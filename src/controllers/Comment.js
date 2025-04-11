const Comment = require('../models/Comment');

exports.submitComment = async (req, res) => {
    try {
        const { comment, studentId } = req.body;

        if (!comment || comment.trim() === '') {
            return res.status(400).json({ success: false, message: 'Comment is required' });
        }

        if (!studentId || studentId.trim() === '') {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const modifiedStudentId = studentId.slice(0, studentId.length - 1) + '-' + studentId.slice(studentId.length - 1);

        const newComment = new Comment({
            comment,
            studentId: modifiedStudentId,
        });

        await newComment.save();

        return res.json({ success: true, message: 'Comment submitted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.comment = (req, res) => {
    try {
        res.render("item/admin/comment", {
            locals: { title: "ความคิดเห็นจากผู้ใช้งาน" }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
};

exports.getComments = async (req, res) => {
    try {
        const comments = await Comment.find().sort({ date: -1 });
        res.json({ success: true, comments });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const commentId = req.params.id;
        await Comment.findByIdAndDelete(commentId);
        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

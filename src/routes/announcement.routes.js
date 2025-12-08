const express = require('express');
const {
    createAnnouncement,
    getAllAnnouncements,
    getActiveAnnouncements,
    deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public/Member Routes (Protected but accessible to all roles)
router.get('/active', protect, getActiveAnnouncements);

// Admin Routes
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .post(createAnnouncement);

router.route('/admin')
    .get(getAllAnnouncements);

router.route('/:id')
    .delete(deleteAnnouncement);

module.exports = router;

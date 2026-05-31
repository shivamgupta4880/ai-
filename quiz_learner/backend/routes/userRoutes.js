const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, updateUser, getPlatformAnalytics, createUser, uploadAvatar, completeProfileSetup } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const avatarUpload = require('../middleware/avatarUpload');

// Avatar upload — any logged in user
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.put('/profile-setup', protect, completeProfileSetup);

// Admin only routes
router.use(protect, authorize('admin'));
router.get('/', getAllUsers);
router.get('/analytics', getPlatformAnalytics);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;

const { Customer, Attendance, Payment } = require('../models');
const { generateToken } = require('../utils/jwt');
const { AppError, asyncHandler, sendSuccess } = require('../utils/errorHandler');

/**
 * @desc    Member login with memberId and password
 * @route   POST /api/member/login
 * @access  Public
 */
const memberLogin = asyncHandler(async (req, res, next) => {
    const { memberId, password } = req.body;

    // Validate input
    if (!memberId || !password) {
        return next(new AppError('Please provide member ID and password', 400));
    }

    // Find customer with password field
    const customer = await Customer.findOne({ memberId }).select('+password');
    if (!customer) {
        return next(new AppError('Invalid member ID or password', 401));
    }

    // Check if customer has password set
    if (!customer.password) {
        return next(new AppError('Member account not activated. Contact admin.', 401));
    }

    // Verify password
    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
        return next(new AppError('Invalid member ID or password', 401));
    }

    // Update last login
    customer.lastLogin = new Date();
    await customer.save();

    // Generate JWT token
    const token = generateToken(customer._id);

    // Remove password from response
    customer.password = undefined;

    sendSuccess(res, 200, {
        customer,
        token,
        isFirstLogin: customer.isFirstLogin,
    }, 'Login successful');
});

/**
 * @desc    Get member profile
 * @route   GET /api/member/me
 * @access  Private (Member)
 */
const getMemberProfile = asyncHandler(async (req, res, next) => {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
        return next(new AppError('Member not found', 404));
    }

    sendSuccess(res, 200, { customer });
});

/**
 * @desc    Update member profile
 * @route   PUT /api/member/profile
 * @access  Private (Member)
 */
const updateMemberProfile = asyncHandler(async (req, res, next) => {
    const { name, phone, email, photo } = req.body;

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
        return next(new AppError('Member not found', 404));
    }

    // Update allowed fields only
    if (name) customer.name = name;
    if (phone) customer.phone = phone;
    if (email) customer.email = email;
    if (photo) customer.photo = photo;

    await customer.save();

    sendSuccess(res, 200, { customer }, 'Profile updated successfully');
});

/**
 * @desc    Change password
 * @route   PUT /api/member/change-password
 * @access  Private (Member)
 */
const changePassword = asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return next(new AppError('Please provide current and new password', 400));
    }

    if (newPassword.length < 4) {
        return next(new AppError('Password must be at least 4 characters', 400));
    }

    // Get customer with password field
    const customer = await Customer.findById(req.user.id).select('+password');
    if (!customer) {
        return next(new AppError('Member not found', 404));
    }

    // Verify current password
    const isMatch = await customer.comparePassword(currentPassword);
    if (!isMatch) {
        return next(new AppError('Current password is incorrect', 401));
    }

    // Update password and first login flag
    customer.password = newPassword;
    customer.isFirstLogin = false;
    await customer.save();

    // Generate new token
    const token = generateToken(customer._id);

    sendSuccess(res, 200, { token }, 'Password changed successfully');
});

/**
 * @desc    Get member attendance history
 * @route   GET /api/member/attendance
 * @access  Private (Member)
 */
const getMemberAttendance = asyncHandler(async (req, res, next) => {
    const { limit = 30, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const attendance = await Attendance.find({ customerId: req.user.id })
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const total = await Attendance.countDocuments({ customerId: req.user.id });

    sendSuccess(res, 200, {
        attendance,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * @desc    Get member payment history
 * @route   GET /api/member/payments
 * @access  Private (Member)
 */
const getMemberPayments = asyncHandler(async (req, res, next) => {
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const payments = await Payment.find({ customerId: req.user.id })
        .sort({ paymentDate: -1 })
        .limit(parseInt(limit))
        .skip(skip);

    const total = await Payment.countDocuments({ customerId: req.user.id });

    sendSuccess(res, 200, {
        payments,
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * @desc    Subscribe to push notifications
 * @route   POST /api/member/subscribe-push
 * @access  Private (Member)
 */
const subscribePushNotification = asyncHandler(async (req, res, next) => {
    const { subscription } = req.body;

    if (!subscription) {
        return next(new AppError('Push subscription data required', 400));
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
        return next(new AppError('Member not found', 404));
    }

    // Store push subscription (you'll need to add this field to Customer model if needed)
    // For now, just acknowledge
    sendSuccess(res, 200, { subscription }, 'Push notification subscription successful');
});

module.exports = {
    memberLogin,
    getMemberProfile,
    updateMemberProfile,
    changePassword,
    getMemberAttendance,
    getMemberPayments,
    subscribePushNotification,
};

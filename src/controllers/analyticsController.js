const { Customer, Attendance } = require('../models');
const { asyncHandler, sendSuccess } = require('../utils/errorHandler');

/**
 * @desc    Get dashboard overview stats
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
    // 1. Customer Stats
    const totalCustomers = await Customer.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Active: validity > nextWeek (safe)
    // Expiring: today <= validity <= nextWeek
    // Expired: validity < today

    const activeCustomers = await Customer.countDocuments({ validity: { $gt: nextWeek } });
    const expiringCustomers = await Customer.countDocuments({ validity: { $gte: today, $lte: nextWeek } });
    const expiredCustomers = await Customer.countDocuments({ validity: { $lt: today } });

    // 2. Attendance Stats (Today)
    const todayStr = today.toISOString().split('T')[0];
    const todayAttendance = await Attendance.countDocuments({ date: todayStr });

    sendSuccess(res, 200, {
        customers: {
            total: totalCustomers,
            active: activeCustomers,
            expiring: expiringCustomers,
            expired: expiredCustomers
        },
        attendance: {
            today: todayAttendance
        }
    });
});

/**
 * @desc    Get plan popularity data
 * @route   GET /api/analytics/plans
 * @access  Private
 */
const getPlanPopularity = asyncHandler(async (req, res, next) => {
    const stats = await Customer.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);

    // Format for Chart.js
    const labels = stats.map(item => item._id);
    const data = stats.map(item => item.count);

    sendSuccess(res, 200, {
        labels,
        data,
        raw: stats
    });
});

/**
 * @desc    Get age demographics
 * @route   GET /api/analytics/demographics
 * @access  Private
 */
const getAgeDemographics = asyncHandler(async (req, res, next) => {
    // Define age ranges: <18, 18-25, 26-35, 36-50, 50+
    const stats = await Customer.aggregate([
        {
            $bucket: {
                groupBy: '$age',
                boundaries: [0, 18, 26, 36, 51, 120],
                default: 'Other',
                output: {
                    count: { $sum: 1 }
                }
            }
        }
    ]);

    // Map bucket IDs to readable labels
    const labelMap = {
        0: 'Under 18',
        18: '18-25',
        26: '26-35',
        36: '36-50',
        51: '50+'
    };

    const formattedStats = stats.map(item => ({
        label: labelMap[item._id] || 'Other',
        count: item.count
    }));

    sendSuccess(res, 200, {
        labels: formattedStats.map(item => item.label),
        data: formattedStats.map(item => item.count),
        raw: formattedStats
    });
});

/**
 * @desc    Get business growth (last 6 months)
 * @route   GET /api/analytics/growth
 * @access  Private
 */
const getBusinessGrowth = asyncHandler(async (req, res, next) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months + current month = 6
    sixMonthsAgo.setDate(1); // Start of that month

    const stats = await Customer.aggregate([
        {
            $match: {
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    month: { $month: '$createdAt' },
                    year: { $year: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Fill in missing months with 0
    const labels = [];
    const data = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthIndex = d.getMonth();
        const year = d.getFullYear();

        labels.push(`${monthNames[monthIndex]} ${year}`);

        // Find matching stat
        const stat = stats.find(s => s._id.month === (monthIndex + 1) && s._id.year === year);
        data.push(stat ? stat.count : 0);
    }

    sendSuccess(res, 200, {
        labels,
        data,
        raw: stats
    });
});

module.exports = {
    getDashboardStats,
    getPlanPopularity,
    getAgeDemographics,
    getBusinessGrowth
};

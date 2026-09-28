/**
 * controllers/admin.controller.js — Admin Module
 *
 * Endpoints:
 *  GET    /api/admin/dashboard          → Summary stats (MongoDB aggregation)
 *  GET    /api/admin/users              → List all users (paginated)
 *  PATCH  /api/admin/users/:id/toggle   → Deactivate / reactivate account
 *  GET    /api/admin/reports/drives     → Drive-wise application & selection report
 *
 * Access: admin only (enforced at router level via allowRoles('admin'))
 */

'use strict';

const User = require('../models/User.model');
const StudentProfile = require('../models/StudentProfile.model');
const Drive = require('../models/Drive.model');
const Application = require('../models/Application.model');
const { BRANCHES } = require('../models/StudentProfile.model');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

// ─────────────────────────────────────────────────────────────
// GET /api/admin/dashboard
//
// Returns:
//  - totalStudents
//  - placedStudents
//  - activeDrives
//  - totalDrives
//  - totalApplications
//  - averagePackage (CTC of Selected applications)
//  - branchWisePlacementPercent
//  - placementRate (%)
// ─────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    // Run all independent queries in parallel for speed
    const [
      totalStudents,
      placedStudents,
      activeDrives,
      totalDrives,
      totalApplications,
      branchStats,
      avgPackageResult,
    ] = await Promise.all([
      // Total registered students
      StudentProfile.countDocuments(),

      // Students with isPlaced: true
      StudentProfile.countDocuments({ isPlaced: true }),

      // Active drives (Upcoming or Ongoing, deadline not passed)
      Drive.countDocuments({
        status: { $in: ['Upcoming', 'Ongoing'] },
        deadline: { $gt: new Date() },
      }),

      // Total drives ever created
      Drive.countDocuments(),

      // Total applications submitted
      Application.countDocuments(),

      // Branch-wise: total students and placed students per branch
      StudentProfile.aggregate([
        {
          $group: {
            _id: '$branch',
            total: { $sum: 1 },
            placed: { $sum: { $cond: ['$isPlaced', 1, 0] } },
          },
        },
        {
          $project: {
            branch: '$_id',
            total: 1,
            placed: 1,
            placementPercent: {
              $round: [
                {
                  $multiply: [
                    { $divide: ['$placed', { $max: ['$total', 1] }] },
                    100,
                  ],
                },
                1, // 1 decimal place
              ],
            },
            _id: 0,
          },
        },
        { $sort: { branch: 1 } },
      ]),

      // Average CTC of drives where at least one student was Selected
      Application.aggregate([
        { $match: { status: 'Selected' } },
        {
          $lookup: {
            from: 'drives',
            localField: 'drive',
            foreignField: '_id',
            as: 'driveInfo',
          },
        },
        { $unwind: '$driveInfo' },
        {
          $group: {
            _id: null,
            averagePackage: { $avg: '$driveInfo.ctc' },
            totalSelected: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            averagePackage: { $round: ['$averagePackage', 2] },
            totalSelected: 1,
          },
        },
      ]),
    ]);

    const placementRate =
      totalStudents > 0
        ? Math.round((placedStudents / totalStudents) * 100 * 10) / 10
        : 0;

    // Fill in branches with 0 students (so all 5 always appear)
    const branchMap = Object.fromEntries(branchStats.map((b) => [b.branch, b]));
    const branchWisePlacement = BRANCHES.map((branch) =>
      branchMap[branch] || { branch, total: 0, placed: 0, placementPercent: 0 }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalStudents,
          placedStudents,
          unplacedStudents: totalStudents - placedStudents,
          placementRate,
          activeDrives,
          totalDrives,
          totalApplications,
          averagePackage: avgPackageResult[0]?.averagePackage ?? 0,
          totalSelected: avgPackageResult[0]?.totalSelected ?? 0,
          branchWisePlacement,
        },
        'Dashboard stats fetched'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/users
// Query params: ?role=student&page=1&limit=20&search=rahul
// ─────────────────────────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          users,
        },
        'Users fetched'
      )
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle
// Toggles isVerified (used as active/inactive flag for accounts)
// Admin cannot deactivate their own account.
// ─────────────────────────────────────────────────────────────
const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user.userId) {
      throw new ApiError(400, 'Cannot deactivate your own admin account');
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, 'User not found');

    user.isVerified = !user.isVerified;

    // If deactivating — also invalidate their refresh token (force logout)
    if (!user.isVerified) {
      user.refreshToken = null;
    }

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(
        200,
        { userId: user._id, isVerified: user.isVerified },
        `Account ${user.isVerified ? 'activated' : 'deactivated'} successfully`
      )
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/reports/drives
// Returns per-drive: applicant count by status, company, CTC
// ─────────────────────────────────────────────────────────────
const getDriveReport = async (req, res, next) => {
  try {
    const report = await Application.aggregate([
      // Group by drive + status to count each status
      {
        $group: {
          _id: { drive: '$drive', status: '$status' },
          count: { $sum: 1 },
        },
      },
      // Pivot: reshape status counts into named fields
      {
        $group: {
          _id: '$_id.drive',
          statusBreakdown: {
            $push: { status: '$_id.status', count: '$count' },
          },
          totalApplications: { $sum: '$count' },
        },
      },
      // Join drive details
      {
        $lookup: {
          from: 'drives',
          localField: '_id',
          foreignField: '_id',
          as: 'driveInfo',
        },
      },
      { $unwind: '$driveInfo' },
      // Final shape
      {
        $project: {
          _id: 0,
          driveId: '$_id',
          company: '$driveInfo.company',
          jobRole: '$driveInfo.jobRole',
          ctc: '$driveInfo.ctc',
          status: '$driveInfo.status',
          deadline: '$driveInfo.deadline',
          totalApplications: 1,
          statusBreakdown: 1,
        },
      },
      { $sort: { totalApplications: -1 } },
    ]);

    // For each drive, extract Selected count cleanly
    const reportWithSelected = report.map((r) => {
      const selectedEntry = r.statusBreakdown.find((s) => s.status === 'Selected');
      return { ...r, selectedCount: selectedEntry?.count ?? 0 };
    });

    return res.status(200).json(
      new ApiResponse(200, { count: report.length, report: reportWithSelected }, 'Drive report fetched')
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  getDriveReport,
};

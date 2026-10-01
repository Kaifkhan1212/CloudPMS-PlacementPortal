/**
 * routes/index.js — Master API Router
 *
 * All feature routers mounted here under /api prefix.
 *
 * Route map:
 *   /api/auth/*        → Public auth (register, login, refresh, logout, /me)
 *   /api/students/*    → Student module  [role: student]
 *   /api/placement/*   → Placement cell  [role: placement_cell, admin]
 *   /api/admin/*       → Admin module    [role: admin]
 */

'use strict';

const express = require('express');
const router = express.Router();

const authRoutes      = require('./auth.routes');
const studentRoutes   = require('./student.routes');
const placementRoutes = require('./placement.routes');
const emailRoutes     = require('./email.routes');
const adminRoutes     = require('./admin.routes');

router.use('/auth',      authRoutes);
router.use('/students',  studentRoutes);
router.use('/placement', placementRoutes);
router.use('/placement-cell/emails', emailRoutes);
router.use('/admin',     adminRoutes);

module.exports = router;

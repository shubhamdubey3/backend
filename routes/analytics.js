const express = require('express');
const Task = require('../models/Task');

const router = express.Router();

// Get task count by status
router.get('/task-counts', async (req, res) => {
  try {
    const taskCounts = await Task.aggregate([
      {
        $match: {
          user: req.user._id
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { status: 1 }
      }
    ]);

    // Get total count
    const totalCount = await Task.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      data: {
        taskCounts,
        totalCount
      }
    });
  } catch (error) {
    console.error('Task counts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task counts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get average rating by status
router.get('/average-ratings', async (req, res) => {
  try {
    const averageRatings = await Task.aggregate([
      {
        $match: {
          user: req.user._id,
          rating: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$status',
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          averageRating: { $round: ['$averageRating', 2] },
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { status: 1 }
      }
    ]);

    // Get overall average rating
    const overallStats = await Task.aggregate([
      {
        $match: {
          user: req.user._id,
          rating: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          overallAverageRating: { $avg: '$rating' },
          totalRatedTasks: { $sum: 1 }
        }
      },
      {
        $project: {
          overallAverageRating: { $round: ['$overallAverageRating', 2] },
          totalRatedTasks: 1,
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        averageRatings,
        overallStats: overallStats[0] || { overallAverageRating: 0, totalRatedTasks: 0 }
      }
    });
  } catch (error) {
    console.error('Average ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching average ratings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
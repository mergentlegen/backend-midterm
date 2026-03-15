const express = require('express');
const { createPledge, finalizeProject } = require('../controllers/pledgeController');

const router = express.Router();

router.post('/projects/:id/pledges', createPledge);
router.post('/projects/:id/finalize', finalizeProject);

module.exports = router;

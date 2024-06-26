const express = require('express');
const router = express.Router();
const SubIssue = require('../model/subissue');
const Issue = require('../model/issue');
//to get idvidual sub issue
router.get('/:id', async (req,res) =>{
  try{
    const subissue = await SubIssue.findById(req.params.id);
    if(!subissue){
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json(subissue);
  }catch (err){
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});
// Create a new sub-issue
router.post('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const { title, summary,subissueType, status, priority, assignedTo, projectId } = req.body;

    const newSubIssue = new SubIssue({
      title,
      summary,
      subissueType,
      status,
      priority,
      assignedTo,
      parentIssue: issueId,
      projectId
    });

    await newSubIssue.save();

    const parentIssue = await Issue.findById(issueId);
    parentIssue.subIssues.push(newSubIssue._id);
    await parentIssue.save();

    res.status(201).json(newSubIssue);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create sub-issue', error });
  }
});

// Get all sub-issues for an issue
router.get('/issue/:issueId', async (req, res) => {
  try {
    const { issueId } = req.params;
    const subIssues = await SubIssue.find({ parentIssue: issueId });
    res.status(200).json(subIssues);
  } catch (error) {
    res.status(400).json({ message: 'Failed to fetch sub-issues', error });
  }
});

// Update a sub-issue
router.put('/:id', async (req, res) => {
  try {
    const subissue = await SubIssue.findById(req.params.id);
    if (!subissue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    subissue.title = req.body.title || subissue.title;
    subissue.summary = req.body.summary || subissue.summary;
    subissue.subissueType = req.body.subissueType || subissue.subissueType;
    subissue.status = req.body.status || subissue.status;
    subissue.priority = req.body.priority || subissue.priority;
    subissue.assignedTo = req.body.assignedTo || subissue.assignedTo;
    subissue.updatedDate = Date.now();

    const updatedSubIssue = await subissue.save();
    res.json(updatedSubIssue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// Delete a sub-issue
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const subIssue = await SubIssue.findById(id);
    if (!subIssue) {
      return res.status(404).json({ message: 'Sub-issue not found' });
    }

    const parentIssue = await Issue.findById(subIssue.parentIssue);
    parentIssue.subIssues.pull(id);
    await parentIssue.save();

    await SubIssue.findByIdAndDelete(id);

    res.status(200).json({ message: 'Sub-issue deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to delete sub-issue', error });
  }
});

module.exports = router;

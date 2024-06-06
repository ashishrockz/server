const express = require('express');
const router = express.Router();
const Issue = require('../model/issue');
const Project = require('../model/project');
const Sprint = require('../model/sprint');

router.get('/:sprintId', async (req, res) => {
  try {
    const sprintId = req.params.sprintId;
    const issues = await Issue.find({ sprintId });
    if (!issues || issues.length === 0) {
      return res.status(404).json({ message: 'No issues found for this sprint' });
    }
    res.json(issues);
  } catch (err) {
    console.error("Error fetching issues:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Create a new issue for a sprint
router.post('/:sprintId', async (req, res) => {
  // Extract necessary data from request body
  const { title, Summary, status, issueType, priority,assignedTo, projectId } = req.body;
  const sprintId = req.params.sprintId; // Get sprintId from URL params

  try {
    // Check if the sprint exists
    const sprint = await Sprint.findById(sprintId);
    if (!sprint) {
      return res.status(404).json({ message: 'Sprint not found' });
    }

    // Create a new issue instance
    const issue = new Issue({
      title,
      Summary,
      status: status || 'Open',
      issueType: issueType || 'Task',
      priority: priority || 'Medium',
      assignedTo,
      projectId,
      sprintId
    });

    // Save the new issue to the database
    const newIssue = await issue.save();

    // If applicable, update associated project
    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) {
        // Ensure that project.issues is defined before pushing newIssue._id
        project.issues = project.issues || [];
        project.issues.push(newIssue._id);
        await project.save();
      }
    }

    // Update the sprint with the new issue
    sprint.issues = sprint.issues || [];
    sprint.issues.push(newIssue._id);
    await sprint.save();

    // Send a success response with the new issue data
    res.status(201).json(newIssue);
  } catch (err) {
    // If an error occurs, send an error response
    res.status(400).json({ message: err.message });
  }
});
router.get('/:sprintId/task/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});


// Update an issue
router.put('/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    issue.title = req.body.title || issue.title;
    issue.Summary = req.body.Summary || issue.Summary;
    issue.status = req.body.status || issue.status;
    issue.issueType = req.body.issueType || issue.issueType;
    issue.priority = req.body.priority || issue.priority;
    issue.assignedTo = req.body.assignedTo || issue.assignedTo;
    issue.updatedDate = Date.now();

    const updatedIssue = await issue.save();
    res.json(updatedIssue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const issue = await Issue.findOneAndDelete({ _id: req.params.id });
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    // Remove the issue from the sprint's issue list
    await Sprint.updateOne({ issues: issue._id }, { $pull: { issues: issue._id } });

    // Remove the issue from the project's issue list
    await Project.updateOne({ issues: issue._id }, { $pull: { issues: issue._id } });

    res.json({ message: 'Issue deleted' });
  } catch (err) {
    console.error('Error deleting issue:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

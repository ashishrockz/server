const express = require('express');
const router = express.Router();
const Issue = require('../model/issue');
const Project = require('../model/project');
const Sprint = require('../model/sprint');

router.get('/:sprintId', async (req, res) => {
  try {
    const issues = await Issue.find({ sprintId: req.params.sprintId });
    if (!issues || issues.length === 0) {
      return res.status(404).json({ message: 'No issues found for this sprint' });
    }
    res.json(issues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new issue for a sprint
router.post('/:sprintId', async (req, res) => {
  // Extract necessary data from request body
  const { title, Summary, status, issueType, priority, projectId } = req.body;
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

// Get a single issue
router.get('/issue/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }
    res.json(issue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update an issue
router.put('/issue/:id', async (req, res) => {
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
    issue.updatedDate = Date.now();

    const updatedIssue = await issue.save();
    res.json(updatedIssue);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an issue
router.delete('/issue/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    await issue.remove();

    // Remove the issue from the sprint's issue list
    const sprint = await Sprint.findOne({ issues: issue._id });
    if (sprint) {
      sprint.issues.pull(issue._id);
      await sprint.save();
    }

    // Remove the issue from the project's issue list
    const project = await Project.findOne({ issues: issue._id });
    if (project) {
      project.issues.pull(issue._id);
      await project.save();
    }

    res.json({ message: 'Issue deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

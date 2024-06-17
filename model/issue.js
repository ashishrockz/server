const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  title: { type: String, required: true },
  Summary: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  issueType: { type: String, enum: ['Task', 'Epic','Bug'], default: 'Task' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  assignedTo:{ type: String, required: true },
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sprint', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
});

// Pre-save hook to generate customId
issueSchema.pre('save', async function (next) {
  if (this.isNew) {
    const project = await this.model('Project').findOne({ _id: this.projectId });
    const projectKey = project.key;
    const issueCount = await this.constructor.countDocuments({ projectId: this.projectId });
    this.customId = `${projectKey}-${issueCount + 1}`;
  }
  next();
});

module.exports = mongoose.model('Issue', issueSchema);

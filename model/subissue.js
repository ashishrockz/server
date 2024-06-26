const mongoose = require('mongoose');

const subIssueSchema = new mongoose.Schema({
  customId: { type: String, unique: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  subissueType: { type: String, enum: ['SubTask', 'Bug'], default: 'SubTask' },
  status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  assignedTo: { type: String, required: true },
  parentIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true }
});

// Pre-save hook to generate customId
subIssueSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const parentIssue = await this.model('Issue').findById(this.parentIssue).populate('projectId');
      const project = await this.model('Project').findById(parentIssue.projectId);
      const projectKey = project.key;
      let customId;
      let isUnique = false;

      for (let attempt = 0; attempt < 5; attempt++) { // Retry up to 5 times
        const subIssueCount = await this.constructor.countDocuments({ parentIssue: this.parentIssue });
        customId = `${parentIssue.customId}-${subIssueCount + 1 + attempt}`; // Adding attempt to ensure uniqueness
        const existingSubIssue = await this.constructor.findOne({ customId });
        if (!existingSubIssue) {
          isUnique = true;
          break;
        }
      }

      if (!isUnique) {
        throw new Error('Failed to generate a unique customId after multiple attempts');
      }

      this.customId = customId;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('SubIssue', subIssueSchema);
// const mongoose = require('mongoose');
// const Issue = require('./issue'); // Import the Issue model

// const subIssueSchema = new mongoose.Schema({
//   customId: { type: String, unique: true },
//   title: { type: String, required: true },
//   Summary: { type: String, required: true },
//   status: { type: String, enum: ['Open', 'In Progress', 'Closed'], default: 'Open' },
//   priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
//   createdDate: { type: Date, default: Date.now },
//   updatedDate: { type: Date, default: Date.now },
//   assignedTo: { type: String, required: true },
//   parentIssue: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
//   projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true }
// });

// // Pre-save hook to generate customId
// subIssueSchema.pre('save', async function (next) {
//   if (this.isNew) {
//     try {
//       // Find the parent Issue to get projectId and the latest customId
//       const parentIssue = await Issue.findById(this.parentIssue);
//       if (!parentIssue) {
//         throw new Error('Parent issue not found');
//       }
//       const projectId = parentIssue.projectId;

//       // Fetch the highest customId from the Issue collection
//       const latestIssue = await Issue.findOne({ projectId })
//         .sort('-customId')
//         .exec();

//       let customId;
//       if (latestIssue) {
//         const latestCustomId = latestIssue.customId;
//         const lastDashIndex = latestCustomId.lastIndexOf('-');
//         const sequenceNumber = parseInt(latestCustomId.substring(lastDashIndex + 1)) + 1;
//         customId = `${latestCustomId.substring(0, lastDashIndex + 1)}${sequenceNumber}`;
//       } else {
//         customId = `${projectId}-1`; // Starting point if no issues exist
//       }

//       this.customId = customId;
//       next();
//     } catch (error) {
//       next(error);
//     }
//   } else {
//     next();
//   }
// });

// module.exports = mongoose.model('SubIssue', subIssueSchema);

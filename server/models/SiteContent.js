import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      unique: true,
      default: 'main',
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.SiteContent || mongoose.model('SiteContent', siteContentSchema);

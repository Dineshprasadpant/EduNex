import mongoose from "mongoose";

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    linkUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Advertisement = mongoose.model("Advertisement", advertisementSchema);

export default Advertisement;
import mongoose from "mongoose";

const RelationshipSchema = new mongoose.Schema({
  // Lưu trực tiếp ADDRESS (String), không phải ObjectId
  requester: { 
    type: String, 
    required: true, 
    lowercase: true, 
    index: true 
  },
  
  recipient: { 
    type: String, 
    required: true, 
    lowercase: true, 
    index: true 
  },

  status: { 
    type: String, 
    enum: ["pending", "accepted", "blocked"], 
    default: "pending" 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// Index unique để đảm bảo A và B chỉ có 1 quan hệ duy nhất
RelationshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// --- VIRTUAL POPULATE (Join bảng User bằng Address) ---

RelationshipSchema.virtual('requesterInfo', {
  ref: 'User',
  localField: 'requester',  // Trường trong Relationship (là address string)
  foreignField: 'address',  // Trường trong User (là address string)
  justOne: true
});

RelationshipSchema.virtual('recipientInfo', {
  ref: 'User',
  localField: 'recipient',
  foreignField: 'address',
  justOne: true
});

const Relationship = mongoose.models.Relationship || mongoose.model("Relationship", RelationshipSchema);
export default Relationship;
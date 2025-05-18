import mongoose, { Schema, Document } from 'mongoose'

export interface IBusiness extends Document {
  name: string
  ruc: string
  address: string
  phone: string
  email: string
  owner: Schema.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const BusinessSchema = new Schema<IBusiness>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    ruc: {
      type: String,
      required: false,
      trim: true,
      unique: true
    },
    address: {
      type: String,
      required: false,
      trim: true
    },
    phone: {
      type: String,
      required: false,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'clients',
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

const BusinessModel = mongoose.model<IBusiness>('business', BusinessSchema)

export default BusinessModel
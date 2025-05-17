import mongoose, { Model, Schema } from 'mongoose'

interface IClient {
  name: string
  email: string
  phone: string
  country: string
  city: string
  dateOfBirth: Date
  businesses: [{
    name: string
    isMain: boolean
  }]
  paymentInfo: {
    preferredMethod: string
    lastPaymentDate: Date
    cardType?: string
    cardInfo?: string
    bank?: string
  }
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    businesses: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      isMain: {
        type: Boolean,
        default: false
      }
    }],
    paymentInfo: {
      preferredMethod: {
        type: String,
        default: null
      },
      lastPaymentDate: {
        type: Date,
        default: null
      },
      cardType: {
        type: String,
        default: null
      },
      cardInfo: {
        type: String,
        default: null
      },
      bank: {
        type: String,
        default: null
      }
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
)

const ClientModel: Model<IClient> = mongoose.model<IClient>('clients', ClientSchema)

export default ClientModel
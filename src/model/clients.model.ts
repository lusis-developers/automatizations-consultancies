import mongoose, { Model, Schema } from 'mongoose'

// Definimos la interfaz para el cliente
interface IClient {
  name: string
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
  }
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    name: {
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
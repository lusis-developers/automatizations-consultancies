import mongoose, { Model, Schema } from "mongoose";

interface IClient {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  dateOfBirth: Date;
  nationalIdentification?: string;
  businesses: Schema.Types.ObjectId[]; // Cambiado a array de referencias
  paymentInfo: {
    preferredMethod: string;
    lastPaymentDate: Date;
    cardType?: string;
    cardInfo?: string;
    bank?: string;
  };
  IPortfolioMetaAdsMeeting: IPortfolioMetaAdsMeeting;
  transactions: Schema.Types.ObjectId[];
}

interface IPortfolioMetaAdsMeeting {
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  appointmentId: string; // ID de la cita de GoHighLevel
  scheduledTime: Date;   // Fecha y hora de la cita
}

const ClientSchema: Schema<IClient> = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    IPortfolioMetaAdsMeeting: {
      type: {
        status: { 
          type: String,
          enum: ['scheduled', 'completed', 'cancelled', 'no-show'], // Estados posibles
        },
        appointmentId: { type: String },
        scheduledTime: { type: Date },
      },
      required: false,
      default: null
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    nationalIdentification: { 
      type: String, 
      trim: true 
    },
    businesses: [
      {
        type: Schema.Types.ObjectId,
        ref: "business",
      },
    ],
    paymentInfo: {
      preferredMethod: {
        type: String,
        default: null,
      },
      lastPaymentDate: {
        type: Date,
        default: null,
      },
      cardType: {
        type: String,
        default: null,
      },
      cardInfo: {
        type: String,
        default: null,
      },
      bank: {
        type: String,
        default: null,
      },
    },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "transactions",
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const ClientModel: Model<IClient> = mongoose.model<IClient>(
  "clients",
  ClientSchema,
);

export default ClientModel;

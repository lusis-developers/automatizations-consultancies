import mongoose, { Model, Schema, Types } from "mongoose";

export interface IClient {
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
  meetings: any;
  transactions: Schema.Types.ObjectId[];
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
    meetings: [{
      type: Schema.Types.ObjectId,
      ref: "meetings", // Referencia a nuestra nueva colección
    }],
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

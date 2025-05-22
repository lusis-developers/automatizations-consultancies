import { Schema, model, Document } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  intentId: string;
  amount: number;
  paymentMethod: string;
  cardInfo?: string;
  cardType?: string;
  bank?: string;
  date: Date;
  description: string;
  clientId: Schema.Types.ObjectId;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    intentId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    cardInfo: {
      type: String,
    },
    cardType: {
      type: String,
    },
    bank: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "clients",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

const TransactionModel = model<ITransaction>("transactions", TransactionSchema);

export default TransactionModel;

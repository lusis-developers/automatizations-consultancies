import { Schema, model, Document } from "mongoose";

export interface IPaymentIntent extends Document {
    intentId: string;
    status: "pending" | "paid" | "failed";
    email?: string;
    name?: string;
    phone?: string;
    amount: number;
    description: string;
    metadata?: Record<string, any>;
    paymentLink: string;
    transactionId?: string;
    createdAt: Date;
    paidAt?: Date;
    userId?: string;
}

const PaymentIntentSchema = new Schema<IPaymentIntent>(
    {
        intentId: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
        email: { type: String },
        name: { type: String },
        phone: { type: String },
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        metadata: { type: Object },
        paymentLink: { type: String, required: true },
        transactionId: { type: String },
        userId: { type: String },
        createdAt: { type: Date, default: Date.now },
        paidAt: { type: Date },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const PaymentIntent = model<IPaymentIntent>(
    "PaymentIntent",
    PaymentIntentSchema
);

export default PaymentIntent;

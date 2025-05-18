import { Schema, model, Document } from "mongoose";
import { PaymentStatus } from '../enums/paymentStatus.enum'

export interface IPaymentIntent extends Document {
    intentId: string;
    state: PaymentStatus;
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
    businessName: string;  // Nuevo campo
    businessId?: Schema.Types.ObjectId;  // Nuevo campo para la referencia
}

const PaymentIntentSchema = new Schema<IPaymentIntent>(
    {
        intentId: { type: String, required: true, unique: true },
        state: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING,
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
        businessName: { type: String, required: true },
        businessId: { type: Schema.Types.ObjectId, ref: 'business' },
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

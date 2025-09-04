import { Schema, model, Types } from 'mongoose';

export interface IMvpAccount {
  client: Types.ObjectId;
  mvpType: string;
  accountData: Record<string, any>;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MvpAccountSchema = new Schema<IMvpAccount>(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true
    },
    mvpType: {
      type: String,
      required: true,
      enum: ['storybrand', 'other'] // Add other MVP types as needed
    },
    accountData: {
      type: Schema.Types.Mixed,
      required: true
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true, versionKey: false }
);

// Create indexes for faster queries
MvpAccountSchema.index({ client: 1, mvpType: 1 }, { unique: true });
MvpAccountSchema.index({ 'accountData.id': 1, mvpType: 1 });

export default model<IMvpAccount>('MvpAccount', MvpAccountSchema);
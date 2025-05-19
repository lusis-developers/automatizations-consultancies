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
  // Nuevos campos de la consultoría
  instagram?: string // Hacemos los campos opcionales
  tiktok?: string
  empleados?: string
  ingresoMensual?: string
  ingresoAnual?: string
  desafioPrincipal?: string
  objetivoIdeal?: string
  costoPorPlatoPath?: string // Para almacenar la ruta del archivo
  menuRestaurantePath?: string // Para almacenar la ruta del archivo
  ventasClientePath?: string // Para almacenar la ruta del archivo
  ventasMovimientosPath?: string // Para almacenar la ruta del archivo
  ventasProductosPath?: string // Para almacenar la ruta del archivo
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
    },
    // Nuevos campos de la consultoría
    instagram: { type: String, required: false, trim: true },
    tiktok: { type: String, required: false, trim: true },
    empleados: { type: String, required: false, trim: true },
    ingresoMensual: { type: String, required: false, trim: true },
    ingresoAnual: { type: String, required: false, trim: true },
    desafioPrincipal: { type: String, required: false, trim: true },
    objetivoIdeal: { type: String, required: false, trim: true },
    costoPorPlatoPath: { type: String, required: false }, // Campo para la ruta del archivo
    menuRestaurantePath: { type: String, required: false }, // Campo para la ruta del archivo
    ventasClientePath: { type: String, required: false }, // Campo para la ruta del archivo
    ventasMovimientosPath: { type: String, required: false }, // Campo para la ruta del archivo
    ventasProductosPath: { type: String, required: false } // Campo para la ruta del archivo
  },
  {
    timestamps: true,
    versionKey: false
  }
)

const BusinessModel = mongoose.model<IBusiness>('business', BusinessSchema)

export default BusinessModel
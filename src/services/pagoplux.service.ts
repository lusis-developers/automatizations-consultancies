import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

export class PagoPluxService {
  private endpoint: string = process.env.PAGOPLUX_ENDPOINT || 'https://api.pagoplux.com/intv1/integrations/createLinkFacturaResource'
  private establishmentRuc: string = 'MDk5MzAyODQyODAwMQ==' // BASE64 de tu RUC: k3rTOL7NCbGULs2m2jK6a04SUg
  private clientToken: string = process.env.CLIENT_TOKEN || 'RzlNZlR6dzAwcEZBMlVBTDVpZ0lRaVA2NE46N3lVQ0lwYVBKZkpUODRNSlhib240SHNNbFEwejdXUXVEOTJWU0phMHM4S3Q4WlpW'

  

  /**
   * Creates a unique payment link
   * @param amount Total amount to charge (with taxes)
   * @param description Payment description
   * @param customerName Customer's name
   * @param customerEmail Customer's email
   * @param phone Customer's phone number
   * @param prefix Country code (e.g.: +593)
   * @param address Customer's address
   * @param idNumber Customer's ID (use "consumidor final" if not applicable)
   */
  async createPaymentLink(
    amount: number,
    description: string,
    customerName: string,
    customerEmail: string,
    phone: string,
    prefix: string = '+593',
    address: string = 'Address not specified',
    idNumber: string = 'consumidor final',
    extras?: string
  ): Promise<string> {
    try {
      const body = {
        rucEstablecimiento: this.establishmentRuc,
        montoCero: 0,
        monto12: amount,
        descripcion: description,
        linkUnico: true,
        esQR: false,
        esRecurrente: false,
        ci: idNumber,
        nombreCliente: customerName,
        correoCliente: customerEmail,
        direccion: address,
        telefono: phone,
        prefijo: prefix,
        ...(extras ? { extras } : {})
      }

      const response = await axios.post(this.endpoint, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${this.clientToken}`
        }
      })

      console.log('CLIENT_TOKEN: ', process.env.CLIENT_TOKEN)
      console.log('PAGOPLUX_ENDPOINT: ', process.env.PAGOPLUX_ENDPOINT)

      if (response.data?.detail?.url) {
        return response.data.detail.url
      } else {
        throw new Error(`Invalid response: ${JSON.stringify(response.data)}`)
      }
    } catch (error: any) {
      console.error('Error creating payment link:', error)
      throw new Error(`Error creating payment link: ${error?.response?.data?.description || error.message}`)
    }
  }
}

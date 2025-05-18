import 'dotenv/config'

import CustomError from '../errors/customError.error'
import { Resend } from 'resend'
import { generateOnBoardingEmail } from '../emails/generateOnBoarding.email'

class ResendEmail {
  private resend: Resend

  constructor() {
    const RESEND_KEY = process.env.RESEND_KEY
    if (!RESEND_KEY) {
      throw new Error('Resend API key is missing')
    }
    this.resend = new Resend(RESEND_KEY)
  }



  public async sendOnboardingEmail(
    email: string,
    name: string,
    businessName: string
  ): Promise<void> {
    try {
      const content = await generateOnBoardingEmail(email, name, businessName)

      const { data, error } = await this.resend.emails.send({
        to: email,
        from: 'bakano@bakano.ec',
        html: content,
        subject: '¡Bienvenido a Bakano! 🚀'
      })

      if (error) {
        console.error('error: ', error)
        throw new CustomError('Problem sending email from resend', 400, error)
      }
    } catch (error) {
      console.error('Resend email', error)
      throw new Error(`Problem sending onboarding email: ${error}`)
    }
  }
}

export default ResendEmail

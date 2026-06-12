import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

/**
 * Servicio de infraestructura para el envio de correos electronicos
 * utilizando Nodemailer con transporte SMTP.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter<SMTPTransport.SentMessageInfo> | null = null;

  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpUser: string;
  private readonly smtpPass: string;
  private readonly smtpFrom: string;

  constructor(private readonly configService: ConfigService) {
    this.smtpHost = this.configService.get<string>('SMTP_HOST', 'localhost');
    this.smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    this.smtpUser = this.configService.get<string>('SMTP_USER', '');
    this.smtpPass = this.configService.get<string>('SMTP_PASS', '');
    this.smtpFrom = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@elmio.com',
    );
  }

  /**
   * Obtiene o crea el transporter SMTP de forma lazy.
   * @returns Instancia del transporter de Nodemailer.
   */
  private getTransporter(): Transporter<SMTPTransport.SentMessageInfo> {
    if (!this.transporter) {
      this.transporter = createTransport({
        host: this.smtpHost,
        port: this.smtpPort,
        secure: this.smtpPort === 465,
        auth: {
          user: this.smtpUser,
          pass: this.smtpPass,
        },
      });
      this.logger.log('Transporter SMTP inicializado');
    }
    return this.transporter;
  }

  /**
   * Envia un correo electronico con el codigo de recuperacion de contrasena.
   * Genera un template HTML con estilos inline, branding de ElMio y el codigo OTP.
   * @param to - Direccion de correo del destinatario.
   * @param name - Nombre del destinatario para personalizar el saludo.
   * @param code - Codigo OTP de 6 digitos.
   */
  async sendRecoveryEmail(
    to: string,
    name: string,
    code: string,
  ): Promise<void> {
    const html = this.buildRecoveryTemplate(name, code);

    const mailOptions: SMTPTransport.MailOptions = {
      from: this.smtpFrom,
      to,
      subject: 'ElMio - Código de recuperación de contraseña',
      html,
    };

    const transport = this.getTransporter();
    await transport.sendMail(mailOptions);
    this.logger.log(`Correo de recuperacion enviado a ${to}`);
  }

  /**
   * Construye el template HTML para el correo de recuperacion.
   * @param name - Nombre del destinatario.
   * @param code - Codigo OTP de 6 digitos.
   * @returns HTML del correo formateado.
   */
  private buildRecoveryTemplate(name: string, code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1a73e8, #0d47a1); padding: 32px 40px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">ElMio</h1>
                    <p style="margin: 8px 0 0; color: #bbdefb; font-size: 14px;">Recuperación de contraseña</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 16px; color: #333333; font-size: 16px;">Hola <strong>${name}</strong>,</p>
                    <p style="margin: 0 0 24px; color: #555555; font-size: 15px; line-height: 1.5;">
                      Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar:
                    </p>
                    <!-- Code Box -->
                    <div style="text-align: center; margin: 0 0 24px;">
                      <div style="display: inline-block; background-color: #e8f0fe; border: 2px dashed #1a73e8; border-radius: 8px; padding: 16px 40px;">
                        <span style="font-size: 36px; font-weight: 700; color: #1a73e8; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
                      </div>
                    </div>
                    <!-- Expiration Notice -->
                    <p style="margin: 0 0 24px; color: #555555; font-size: 14px; line-height: 1.5; text-align: center;">
                      ⏱️ Este código expira en <strong>10 minutos</strong>.
                    </p>
                    <!-- Warning -->
                    <div style="background-color: #fff8e1; border-left: 4px solid #ffa000; border-radius: 4px; padding: 12px 16px; margin: 0 0 16px;">
                      <p style="margin: 0; color: #6d4c00; font-size: 13px; line-height: 1.4;">
                        ⚠️ Si no solicitaste este código, ignora este correo. Tu cuenta permanece segura.
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 20px 40px; border-top: 1px solid #eeeeee; text-align: center;">
                    <p style="margin: 0; color: #999999; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} ElMio. Todos los derechos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}

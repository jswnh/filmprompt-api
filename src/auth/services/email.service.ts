import { Inject, Injectable, Logger } from '@nestjs/common';
import * as config from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import authConfig from '../config/auth.config.js';

export interface SendVerificationEmailInput {
  to: string;
  firstName: string;
  token: string;
  callback?: string;
}

export interface SendPasswordResetEmailInput {
  to: string;
  firstName: string;
  token: string;
  callback?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(
    @Inject(authConfig.KEY)
    private readonly config: config.ConfigType<typeof authConfig>,
  ) {
    if (this.config.smtpHost && this.config.smtpUser && this.config.smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPass,
        },
      });
    } else {
      this.logger.warn(
        'SMTP credentials not set in environment. EmailService will log emails to console.',
      );
    }
  }

  async sendVerificationEmail(
    input: SendVerificationEmailInput,
  ): Promise<void> {
    const actionUrl = input.callback
      ? `${input.callback}${input.callback.includes('?') ? '&' : '?'}token=${encodeURIComponent(input.token)}`
      : null;

    const subject = 'Verify your email address';
    const text =
      `Hi ${input.firstName},\n\nPlease verify your email address.\n\nToken: ${input.token}\n` +
      (actionUrl ? `\nVerification Link: ${actionUrl}\n` : '');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Welcome, ${input.firstName}!</h2>
        <p style="color: #555;">Please verify your email address to activate your account.</p>
        ${
          actionUrl
            ? `<div style="margin: 25px 0;">
                <a href="${actionUrl}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              <p style="color: #777; font-size: 12px;">Or paste this link into your browser: <br/><a href="${actionUrl}">${actionUrl}</a></p>`
            : `<div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 16px; letter-spacing: 2px;">
                ${input.token}
              </div>`
        }
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.config.emailFrom,
        to: input.to,
        subject,
        text,
        html,
      });
    } else {
      this.logger.log(
        `\n================= [EMAIL VERIFICATION] =================\n` +
          `To: ${input.to}\n` +
          `Subject: ${subject}\n` +
          `Hi ${input.firstName},\n` +
          `Token: ${input.token}\n` +
          (actionUrl ? `Link: ${actionUrl}\n` : '') +
          `========================================================\n`,
      );
    }
  }

  async sendPasswordResetEmail(
    input: SendPasswordResetEmailInput,
  ): Promise<void> {
    const actionUrl = input.callback
      ? `${input.callback}${input.callback.includes('?') ? '&' : '?'}token=${encodeURIComponent(input.token)}`
      : null;

    const subject = 'Reset your password';
    const text =
      `Hi ${input.firstName},\n\nYou requested to reset your password.\n\nToken: ${input.token}\n` +
      (actionUrl ? `\nReset Link: ${actionUrl}\n` : '');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #555;">Hi ${input.firstName}, we received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
        ${
          actionUrl
            ? `<div style="margin: 25px 0;">
                <a href="${actionUrl}" style="background-color: #e00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #777; font-size: 12px;">Or paste this link into your browser: <br/><a href="${actionUrl}">${actionUrl}</a></p>`
            : `<div style="background-color: #f4f4f4; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 16px; letter-spacing: 2px;">
                ${input.token}
              </div>`
        }
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.config.emailFrom,
        to: input.to,
        subject,
        text,
        html,
      });
    } else {
      this.logger.log(
        `\n================= [PASSWORD RESET] =================\n` +
          `To: ${input.to}\n` +
          `Subject: ${subject}\n` +
          `Hi ${input.firstName},\n` +
          `Token: ${input.token}\n` +
          (actionUrl ? `Link: ${actionUrl}\n` : '') +
          `====================================================\n`,
      );
    }
  }
}

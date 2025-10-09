import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

const sendMail = async (to, subject, text) => {
  try {
    const mailOptions = {
      host: env.MAILTRAP.HOST,
      port: env.MAILTRAP.PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: env.MAILTRAP.USER,
        pass: env.MAILTRAP.PASS,
      },
    };
    const transporter = nodemailer.createTransport(mailOptions);

    const info = await transporter.sendMail({
      from: 'Samyak',
      to,
      subject,
      text,
    });

    return info;
  } catch (error) {
    console.error('❌ Mail Error: ', error.message);
    throw error;
  }
};
export { sendMail };

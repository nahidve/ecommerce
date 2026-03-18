import nodemailer from "nodemailer";
import fs from "fs";

// Configure email service (use your business email credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,        // Your app's email (e.g., business@gmail.com)
    pass: process.env.EMAIL_PASS,        // Your app's email password/app-specific password
  },
});

export const sendInvoiceEmail = async (userEmail, invoicePath, orderDetails) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,      // Send FROM your business email
      to: userEmail,                     // Send TO customer's email
      subject: `Order Confirmation - Invoice #${orderDetails._id}`,
      html: `
        <h2>Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p><strong>Order ID:</strong> ${orderDetails._id}</p>
        <p><strong>Amount:</strong> $${orderDetails.amount.toFixed(2)}</p>
        <p>Your invoice is attached below.</p>
      `,
      attachments: [
        {
          filename: `invoice-${orderDetails._id}.pdf`,
          path: invoicePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Invoice email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

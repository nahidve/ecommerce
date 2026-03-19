import nodemailer from "nodemailer";
import fs from "fs";

// ================= TRANSPORTER =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("Email service error:", error);
  } else {
    console.log("Email service is ready");
  }
});

// ================= SEND INVOICE EMAIL =================
export const sendInvoiceEmail = async (userEmail, invoicePath, orderDetails) => {
  try {
    if (!userEmail) {
      console.warn("No user email provided. Skipping email.");
      return;
    }

    let attachments = [];

    // Check if invoice exists
    if (invoicePath && fs.existsSync(invoicePath)) {
      attachments.push({
        filename: `invoice-${orderDetails._id}.pdf`,
        path: invoicePath,
      });
    } else {
      console.warn("Invoice file not found. Sending email without attachment.");
    }

    const mailOptions = {
      from: `"Hawthorne Food Delivery" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation - Invoice #${orderDetails._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Order Confirmation</h2>

          <p>Thank you for your order!</p>

          <h3>Order Details:</h3>
          <p><strong>Order ID:</strong> ${orderDetails._id}</p>
          <p><strong>Total Amount:</strong> $${orderDetails.amount.toFixed(2)}</p>
          <p><strong>Status:</strong> ${orderDetails.status}</p>

          <p>
            Your invoice is ${
              attachments.length ? "attached below." : "currently unavailable."
            }
          </p>

          <br/>

          <p style="font-size: 14px; color: #555;">
            Thank you for choosing Hawthorne Food Delivery!
          </p>
        </div>
      `,
      attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Invoice email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending invoice email:", error.message);
  }
};

// ================= SEND OTP EMAIL =================
export const sendOTPEmail = async (userEmail, otp) => {
  try {
    if (!userEmail) {
      console.warn("No email provided for OTP.");
      return;
    }

    const mailOptions = {
      from: `"Hawthorne Food Delivery" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Verify your email",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center;">
          <h2>Email Verification</h2>

          <p>Your OTP is:</p>

          <h1 style="letter-spacing: 3px;">${otp}</h1>

          <p>This OTP is valid for 5 minutes.</p>

          <p style="font-size: 12px; color: gray;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending OTP email:", error.message);
  }
};
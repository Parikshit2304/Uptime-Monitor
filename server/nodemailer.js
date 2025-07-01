// mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "",
    pass: process.env.EMAIL_PASS, // Use App Password from Gmail
  },
});

/**
 * Sends an alert email when the website is down
 * @param {string} siteUrl - The URL that failed
 */
const sendAlertEmail = async (siteUrl,to,subject,text) => {
  const mailOptions = {
    from: "",
    to, // You can make this dynamic
    subject,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Alert email sent:", info.response);
  } catch (error) {
    console.error("❌ Error sending alert email:", error);
  }
};

module.exports = { sendAlertEmail };

import nodemailer from "nodemailer";

const testAccount = await nodemailer.createTestAccount();

console.log("testAccount", testAccount);


const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "assunta.bauch@ethereal.email",
    pass: "TVZBQUHgwmAsK3qVwu",
  },
});

// async..await is not allowed in global scope, must use a wrapper


export const sendEmail = async({to, subject, html}) => {
   const info = await  transporter.sendMail({
        from: `'URL SHORTENER' <${testAccount.user}>`,
        to,
        subject,
        html
       });

       const testEmailUrl = nodemailer.getTestMessageUrl(info);
       console.log("testEmailUrl", testEmailUrl);
};




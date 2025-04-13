import nodemailer from "nodemailer";
import {info} from "console";
const testAccount = await nodemailer.createTestAccount();

console.log("testAccount", testAccount);


const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, 
  auth: {
    user: testAccount.user,
    pass: testAccount.pass,
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


const testEmailUrl = nodemailer.getTestMessageUrl(info);
console.log("testEmailUrl", testEmailUrl);




import {Resend} from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({to, subject, html}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: "URL SHORTENER <website@resend.dev>",
            to: [to],
            subject,
            html
        });

        if (error) {
            console.log("Email sending error:", error);
            return error;
        }

        console.log("Email sent successfully:", data);
        return data;
    } 
    catch (error) {
        console.log("Caught an error:", error);
        return error;
    }
}
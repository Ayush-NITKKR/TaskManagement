const nodemailer = require("nodemailer");
require("dotenv").config();


const mailSender = async (email , title , body) =>{
    try {
        let tranporter = nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            auth:{
                user:process.env.MAIL_ID,
                pass:process.env.MAIL_PASS,
            }
        })
        let info = await tranporter.sendMail({
            from:'EdTech Plateform By Ayush',
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log(info);
        return info;
        
    } catch (error) {
        console.log(error.message);
        throw error;
    }
}


module.exports = mailSender;

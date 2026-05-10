//OTP,SignUp and Login

require("dotenv").config();



const { log } = require('node:console');
const user = require('../model/User');
const OTP = require('../model/otp');

// Library for OTP

const otpGenerator = require("otp-generator");

//Library for validation

const validator = require("validator");

//For hashing the password

const bcrypt = require("bcrypt");
const Profile = require('../model/Profile');
const  jwt = require('jsonwebtoken');

//Send OTP
 //1.Validate

// 2 generate OTP from library

// 3.save in the Db

exports.sendOTP= async (req, res) => {
    try {
        // Fetch Email from the body
    const {email } = req.body;

        if (!validator.isEmail(email)) {
            return res.status(400).json({ error: "Invalid email" });
        }   

    // check already exist

    const checkUserPresent = await user.findOne({email});

    // If it is already present, then return a response
    if(checkUserPresent){
        return req.status(400).json({
            success:false,
            message:"User already registered"
        })
    }
    //Generate OTP
    let otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    });
    console.log("OTP is generated");

    //Check unique OTP or not 

    let result = await OTP.findOne({otp,email});
    while(result){
        otp = otpGenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
    });
        result = await OTP.findOne({otp});
    }

    // Create a entry in database

    const otpBody = await OTP.create({email , otp});
    
    
    // Return response successfully

    res.status(200).json({
        success:true,
        message:"OPT is sent successfully",
    })
    } catch (error) {
        console.log(error.message);
        console.log("Error in OTP generator");
        res.status(500).json({
        success:true,
        message:"Error in OTP generation",
    })
    }
    
}
//SignUp

//1 . get the data from the req ()
 
//2. Validate the data (match password) (user exist or not)

//3.Verify the OTP the mail

    //find the recent OTP storred for the user
    //validare the OTP

//4.Encrypt the password(bcrypt)

//5.create the entry

//6.return response 

exports.signUp = async (req, res) => {
    try {
        
    
// Fetch the data

    const {firstName ,
         lastName , 
         email ,
         phoneNo , 
         password ,
          Repassword,
        accountType,
        otp,
    } = req.body;

//Validate the Data

    if(!firstName || !email || !phoneNo || !password || !Repassword){
        return res.status(400).json({
            success:false,
            message:"All feilds are required"
        })
    }

    if(firstName && !lastName ){
        lastName = firstName;
    }
    // Valide the email
    if(!validator.isEmail(email) || !validator.isMobilePhone(phoneNo)){
        return res.status(400).json({
            success:false,
            message:"The email is not correct",
        })
    }
    // Find the existance email

    const isExistMail = await user.findOne({email});
    const isExistPhone = await user.findOne({phoneNo});

    if(isExistMail || isExistPhone){
        res.status(400).json({
            success:false,
            message:"User entry exit"
        })
    }

    
    //Password match

    if(password !== Repassword){
        return res.status(400).json({
            success:false,
            message:"The passwords are not matched"
        })
    }
//Find the most recent OTP and Verify otp-> User Input OTP and recentOTP -> system genrated OTP
    const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
    console.log(recentOtp);

    //Validate the OTP
    if(recentOtp.length == 0){
        // OTP is not found
        return res.status(400).json({
            success:false,
            message:"OTP not Found"
        })
    }else if(otp !== recentOtp[0].otp){
        // Invalid OTP
        return res.status(400).json({
            success:false,
            message:"OTP is not matched"
        })
    }
// Hash the Password
    const hashedPassword = await bcrypt.hash(password , 10);
     
//Save the entry in the profileDetail 
    const profileDetail = await Profile.create({
        gender:null,
        dateofBirth:null,
        about:null,
        contact:null,
    })

// register the entry
    // Default Profile pic
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}`;

    const entry = await user.create({
        firstName,
        lastName,
        email,
        phoneNo,
        accountType,
        password: hashedPassword,
        additionalDetails:profileDetail,
        image:avatar
    });

    return res.status(200).json({
        success:true,
        message:"User registerd successfully"
    });
}
catch (error) {
        console.log("signup error ");
        console.log(error.message);
        return res.status(500).json({
            success:false,
            message:"Unable to signup"
        });
    }

}
//Login

//1. Get the data

//2. Validate the date

//3.Verify the password

//4.Create the JWT toke and send over cookie

//login

exports.login = async (req,res) => {
    try {
        
    
    //Extract the password
    const {email , password} = req.body;
    
    // Validate the data

    if(!email || !password){
        return res.status(403).json({
            success:false,
            message:"All feilds arre required",
        })
    }
    //Check user 
    const doesExist = await user.findOne({email})

    //Convert the mongooes document into normal obj
    doesExist = doesExist.toObject();

    if(!doesExist){
        return res.status(401).json({
            success:false,
            message:"user not found",
        })
    }


    
    // verify the hash password

    const verify = await bcrypt.compare(password , doesExist.password);

    //After vrification token is sent to client(JWT)

    if(verify){
        const payload = {
        email: doesExist.email ,
        id:doesExist._id,
        accountType:doesExist.accountType,
        }
        const token = jwt.sign(payload,
            process.env.JWT_SECRET,{
                expiresIn:"2h",
            }
        )
           //Put the token in req body

            doesExist.token = token;
            doesExist.password = undefined;
            // Give the cookie to user
            const option = {
                expires:new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly:true,
            }
            res.cookie("token",token , option).status(200).json({
                success:true,
                token,
                doesExist,
                message:"logged in successfully"
            })
    }else{
        return res.status(401).json({
                success:false,
                message:"password is incorrect try again"
        })
    }
    } catch (error) {
        console.log("Error in login");
        console.log(error.message);
        return res.status(500).json({
            success:false,
            message:"Some error occurs while logginf"
        })
    }
}
//Change password
// 1 get old pass , new pass , confirm pass
// 2 validate the password 

// update pass in db
// send the mail 
//return response
exports.changePassword = async (req,res) => {
    try {
        //Get the data from the request

        const{ oldPassword , newPassword ,confirmPassword } = req.body;

        // Validate 

        if(!oldPassword || !newPassword || !confirmPassword){
            return res.status(400).json({
                success:false,
                message:"All feilds are required"
            })
        }
        if(newPassword !== confirmPassword){
            return res.status(400).json({
                success:false,
                message:"newpassword and confirmpassword are not same"
            })
        }
        
    // verify
        

        // 1 . get the token

        const token = req.cookies.token;

        if(!token){
            return res.status(400).json({
                success:false,
                message:"the token is missing"
            });
        }

        // 2. decode the token

        try {
            const decode = jwt.verify(token , process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                success:false,
                message:"the token is invalid"
            })
        }
        //verify the oldPassword

        const curUser = await user.findOne({email:decode.email});

        if(await bcrypt.compare(oldPassword , user.password)){

            const hashedPassword = bcrypt.hash(newPassword , 10);

            // Entry in db

            const entry = await user.updateOne({email:curUser.email},{password:hashedPassword});

            // send the response

            return res.status(200).json({
                success:false,
                message:"the password is changed successfully"
            })


        }else{
            return res.status(403).json({
                success:false,
                message:"Incorrect Old password"
            })
        }



    } catch (error) {
        console.log("error in changePassword");
        console.log(error.message);
        return res.status(500).json({
            success:false,
            message:"Something went wrong"
        });
    }
}
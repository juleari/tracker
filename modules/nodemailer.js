var nodemailer = require("nodemailer");

var smtpTransport = nodemailer.createTransport("SMTP", {
    service: "Gmail",
    auth: {
        user: "case.tracker.ru@gmail.com",
        pass: ",29A20DV11cj"
    }
});

var send_mess = function(email, subject, text) {

    var mailOptions = {
        from    : 'Case Tracker',
        to      : email,
        subject : subject,
        text    : text
    };

    smtpTransport.sendMail(mailOptions, function(error, response){
        
        if (error) console.log(error)
        else console.log("Message sent: " + response.message);

    });
}

exports.send_mess = send_mess;
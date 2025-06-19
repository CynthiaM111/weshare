const AfricasTalking = require('africastalking');
const dotenv = require('dotenv');

dotenv.config();

const africastalking = AfricasTalking({
    apiKey: process.env.AFRICASTALKING_API_KEY,
    username: 'sandbox'
});

module.exports = async function sendSMS() {

    try {
        const result = await africastalking.SMS.send({
            to: process.env.AFRICASTALKING_PHONE_NUMBER,
            message: 'Hey AT Ninja! Wassup...',
            from: 'WeShare'
        });
        console.log(result);
    } catch (ex) {
        console.error(ex);
    } 

};
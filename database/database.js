require('dotenv').config()
const mongoose = require('mongoose')
// Conectar ao MongoDB
mongoose.connect('mongodb+srv://atlasmongo46:GvXQafANrGPLMzD9@cluster0.xkpmrq4.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {

   
    console.log('MongoDB Connected');
}).catch(err => {
    console.error('Connection error', err);
});

let db = mongoose.connection
db.on('error', (err)=>{
    console.log(err)
})
db.once('open', ()=>{
     // createAdminUser();
    console.log('mongo connection')
})


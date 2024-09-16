require('dotenv').config()
const database = require('./database/database')
const axios = require('axios');
const User = require('./models/User')
const CurrencyPair = require('./models/Pairs')
const auth = require('./controllers/auth')
const SelectedFlag = require('./models/SelectedFlag')
const jwt = require('jsonwebtoken')
// Seu app_id obtido ao registrar na Open Exchange Rates
const appId = process.env.OPEN_EXCHANGE_RATES; // Substitua pelo seu app_id
const methodOverride = require('method-override')
const bcrypt = require('bcryptjs')
// URL da API
const url = `https://openexchangerates.org/api/currencies.json?app_id=`;

async function currencies(){

// Fazer a solicitação com Axios
let urlReturns = await axios.get(url+appId)
console.log(urlReturns)
 
}


const express = require('express')
const path = require('path')
const app = express()
const http = require('http');
const { Server } = require('socket.io');
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname,'public')))
app.use(methodOverride('_method'))
app.use(express.urlencoded({extended:true, limit:'5000mb'}))
app.use(express.json({limit:'5000mb'}))
const server = http.createServer(app);
const io = new Server(server);
// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    // Receber mensagem do cliente
    socket.on('message', (msg) => {
        console.log('Mensagem recebida:', msg);
        // Enviar a mensagem de volta para todos os clientes conectados
        io.emit('message', msg);
    });

    // Desconexão
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});

app.get('/',async (req,res)=>{
    try {
        let pairs = await CurrencyPair.find({})
        let preSelected = await SelectedFlag.findOne()
    res.render('index',{pairs:pairs,preSelected:preSelected})
    } catch (error) {
        console.log(error)
    }
    
})

app.get('/login',(req,res)=>{
  res.render('login')
})

app.post('/login',async (req,res,next)=>{

  try {
  
      const {email,password} = await req.body
      const user = await User.findOne({email:email})
    
      if( user.password == null || !user.password || user.password == undefined){
        res.render('login', {msg:'Usuário ou senha incorretos',error:false})
      }
    
      const pass = bcrypt.compareSync(password, user.password)
    
      if(!user || !pass ){
        res.render('login', {msg:'Usuário ou password incorretos', error:false})
      }
      
      if(user && pass){
        const token = jwt.sign({ _id:user._id }, process.env.TOKEN_SECRET, {
          expiresIn: '7d' // expires in 5min
        });
        res.cookie('Authorization', `${token}`)
    console.log(token)
    
      if(user.admin == true){
        res.redirect('/admin')
  
      }else{
        res.redirect('/')
      }
     
      }
      } catch (error) {
        console.log(error)
      }
    
})

app.post('/admin/savePreSelected',async (req,res)=>{
try {
    let {combination,id} = await req.body
    const [basecurrency, quotecurrency] = combination.split('/');

    let meetComb = await CurrencyPair.findOne({baseCurrency:basecurrency,quoteCurrency:quotecurrency})
    let sflag = await SelectedFlag.find({})
    console.log(meetComb,combination)

    if(sflag.length < 1){
        let preselected = await  SelectedFlag({
            combination:combination,
            baseCurrencyFlag:meetComb.flagBaseCurrency,
            quoteCurrencyFlag:meetComb.flagQuoteCurrency
        })
        await preselected.save()
       return res.redirect('/admin')
    }

 let upflag = await SelectedFlag.findOneAndUpdate({_id:id},{$set:{combination:combination,baseCurrencyFlag:meetComb.flagBaseCurrency,quoteCurrencyFlag:meetComb.flagQuoteCurrency}},{new:true})
console.log(upflag)
return res.redirect('/admin')
} catch (error) {
    console.log(error)
}
  
})

app.get('/admin',auth,async (req,res)=>{
  let user = await req.user
  if(req.user.admin){
    let users = await User.find({})
    let pairs = await CurrencyPair.find({})
let preSelected = await SelectedFlag.findOne({})
    res.render('admin', {users:users,pairs:pairs,preSelected:preSelected})

  }else{
    res.redirect('/')
  }
   
})

app.put('/admin/editUser/:_id',  async (req,res)=>{

    try {
        let id = await req.params._id

        if(!id){
            id = await req.body.id
          }
          let data= await req.body
          console.log(data)
          let msg = await User.findByIdAndUpdate({_id:id},data,{new:true})
          console.log(msg)

    res.redirect('/')
    } catch (error) {
        console.log(error)
    }
})

app.post('/admin/savePairs', async (req,res)=>{
    // Função para salvar um novo par de moedas
let {baseCurrency,quoteCurrency,flagBaseCurrency,flagQuoteCurrency} = req.body
    try {
      const newPair = new CurrencyPair({
        baseCurrency:baseCurrency,
        quoteCurrency:quoteCurrency,
        flagBaseCurrency:flagBaseCurrency,
        flagQuoteCurrency:flagQuoteCurrency
      });

      // Middleware pre-save para verificar duplicação
    const existingPair = await CurrencyPair.findOne({
      baseCurrency: baseCurrency,
      quoteCurrency: quoteCurrency
    });
  
    if (existingPair) {
      res.redirect('/admin')
      return console.log('par de moedas já existe')
    }
  
   
  
      const savedPair = await newPair.save();
      console.log('Par de moedas salvo com sucesso:', savedPair.combination);
      // Consulta para obter documentos ordenados por data de criação
async function attSortRank(){
    try {
        const items = await CurrencyPair.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
}
attSortRank()
      res.redirect('/admin')
    } catch (error) {
      console.error('Erro ao salvar o par de moedas:', error);
    }
  
  
})

app.delete('/admin/deletePair/:id',async (req,res)=>{

    try {
        let id =await req.params.id

        if(!id){
            id =await req.body.id
          }
          await CurrencyPair.findByIdAndDelete(id)
          // Consulta para obter documentos ordenados por data de criação
async function attSortRank(){
    try {
        const items = await CurrencyPair.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
}
attSortRank()
          res.redirect('/admin')
    } catch (error) {
        console.log(error)
    }


})

app.delete('/admin/deleteUser/:id',async (req,res)=>{

    try {
        let id =await req.params.id

        if(!id){
            id =await req.body.id
          }
          await User.findByIdAndDelete(id)
          // Consulta para obter documentos ordenados por data de criação
async function attSortRank(){
    try {
        const items = await User.find({})
          .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
      
        // Atribuir valores numéricos com base na ordem
        items.forEach((item, index) => {
          item.rank = index + 1; // +1 porque os índices começam em 0
        });
      
        // Salvar os documentos atualizados
        await Promise.all(items.map((item) => item.save()));
      
        console.log('Documentos atualizados com sucesso.');
      } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
      }
}
attSortRank()
          res.redirect('/admin')
    } catch (error) {
        console.log(error)
    }


})


app.post('/admin/saveUser', async (req,res)=>{
    let user = await req.user
    let users = await User.find({})
   // let payments = await payment.search()
    try {
     
  
      let {name,email,photo,password} = await req.body
      const userExistss = await User.findOne({$or: [{email: email}]})
      if (userExistss == null || userExistss == undefined || !userExistss) {
        let user = new User({
          name:name,
          email:email,
          password:bcrypt.hashSync(password, 8),
          photo:photo,
         
        })
       await user.save()
       console.log('usuário salvo')
    
       res.redirect('/admin')
        try {
            const items = await User.find({})
              .sort({ createdAt: 1 }); // Ordena em ordem crescente por createdAt
          
            // Atribuir valores numéricos com base na ordem
            items.forEach((item, index) => {
              item.rank = index + 1; // +1 porque os índices começam em 0
            });
          
            // Salvar os documentos atualizados
            await Promise.all(items.map((item) => item.save()));
          
            console.log('Documentos atualizados com sucesso.');
          } catch (error) {
            console.error('Erro ao atualizar documentos:', error);
          }
     }else{
       res.render('admin',{user:user,users:users,msg:'Já existe um E-mail cadastrado'})
     }    
     
   
    } catch (error) {
      console.log(error)
    }
   
  })

  app.post('/logout',async (req,res)=>{
    try {
      let tk = await req.body.tk
      console.log(tk)
     let tt = await jwt.verify(tk,process.env.TOKEN_SECRET).payload
     await tt.destroy()
      res.redirect('/')
    } catch (error) {
      console.log(error)
    }
  })
  

server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
const mongoose = require('mongoose')

const selectedFlag = new mongoose.Schema({
     rank:Number,
     baseCurrencyFlag:String,
     quoteCurrencyFlag:String,
     combination:String,
     createdAt: {
        type: Date,
        default: Date.now, // Esta é a data de criação
      },
    });

const SelectedFlag = mongoose.model('SelectedFlag', selectedFlag);



// Consulta para obter documentos ordenados por data de criação
async function attSortRank(){
    try {
        const items = await SelectedFlag.find({})
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

module.exports = SelectedFlag


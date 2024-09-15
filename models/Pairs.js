const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Definir o esquema do model CurrencyPair
const CurrencyPairSchema = new Schema({
    rank:Number,
  baseCurrency: {
    type: String,
    required: true,   // Ex: "USD"
    uppercase: true,  // Para garantir que as moedas sejam sempre maiúsculas
  },
  quoteCurrency: {
    type: String,
    required: true,   // Ex: "EUR"
    uppercase: true,
  },
  flagBaseCurrency:String,
  flagQuoteCurrency:String,
 /* exchangeRate: {
    type: Number,
    required: true,   // Ex: 0.8435
  },
  timestamp: {
    type: Date,
    default: Date.now  // Data e hora da cotação
  }*/
});



// Definindo um campo virtual "combination"
CurrencyPairSchema.virtual('combination').get(function () {
    // Combina baseCurrency e quoteCurrency
    console.log('pares combinados')
    return `${this.baseCurrency}/${this.quoteCurrency}`;
  });
  
  // Para garantir que o campo virtual apareça na conversão para JSON
  CurrencyPairSchema.set('toJSON', { virtuals: true });
  CurrencyPairSchema.set('toObject', { virtuals: true });




// Criar o model 'CurrencyPair' com base no schema
const CurrencyPair = mongoose.model('CurrencyPair', CurrencyPairSchema);



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

module.exports = CurrencyPair;

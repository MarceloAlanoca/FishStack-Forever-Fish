const { User } = require('./userModel');
const { Article } = require('./articlesModel');
const { CreditIntegrante } = require('./creditsIntegrantesModel');
const { CreditInspiracion } = require('./creditsInspiracionesModel');
const { Purchase } = require('./purchaseModel');

// Relacion muchos a muchos de Ej:
/*
User.belongsToMany(Hobby, { through: 'UserHobbies', foreignKey: 'userId' });
Hobby.belongsToMany(User, { through: 'UserHobbies', foreignKey: 'hobbyId' });
*/
module.exports = {
    User,
    Article,
    CreditIntegrante,
    CreditInspiracion,
    Purchase
};

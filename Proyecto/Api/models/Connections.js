const { User } = require('./userModel');
const { Article } = require('./articlesModel');
const { Fish } = require('./fishModel');
const { Purchase } = require('./purchaseModel');



// Relación muchos a muchos de Ej:
/*
User.belongsToMany(Hobby, { through: 'UserHobbies', foreignKey: 'userId' });
Hobby.belongsToMany(User, { through: 'UserHobbies', foreignKey: 'hobbyId' });
*/
module.exports = {
    User,
    Article,
    Fish,
    Purchase
};
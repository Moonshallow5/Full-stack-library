const  Sequelize  = require("sequelize");
const dotenv=require('dotenv');
dotenv.config();

// Connect to PostgreSQL database using Railway-provided URL
const sequelize = new Sequelize(process.env.DB_URL, {
    define:{
        timestamps:false
    }
  
});

module.exports = sequelize;
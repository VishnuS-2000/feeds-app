const { Sequelize }=require('sequelize')

const sequelize=new Sequelize(process.env.DB_NAME,process.env.SQL_USERNAME,process.env.SQL_PASSWORD,{

    dialect:'postgres',
    host:'localhost'

})

const checkConnection=async()=>{
    try{
        sequelize.authenticate()
        console.log("Database connected")

    }catch(err){
        console.log(err)
    }
}

checkConnection()

module.exports.sequelize=sequelize;

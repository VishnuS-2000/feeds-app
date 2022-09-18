const {Model,DataTypes}=require("sequelize")
const {sequelize}=require("../config/database")

class MerchantSession extends Model{}


MerchantSession.init({
    session_id:{
        type:DataTypes.STRING,
        allowNull:false

    },
    domain_id:{
        type:DataTypes.STRING
    },
    shop:{
        type:DataTypes.STRING
    },
    access_token:{
        type:DataTypes.STRING
    },
    isOnline:{
        type:DataTypes.STRING
    },
    onlineAccessInfo:{
        type:DataTypes.TEXT
    },
    scope:{
        type:DataTypes.STRING
    },
    state:{
        type:DataTypes.STRING
    }

},{
    sequelize,
    modelName:'shopify_sessions'
})


// MerchantSession.sync()

module.exports=MerchantSession;
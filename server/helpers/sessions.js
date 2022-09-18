const {Session} =require('@shopify/shopify-api/dist/auth/session');

const MerchantSession=require("../models/session")
const { Op }=require("sequelize")

let domain_id=''


const storeCallBack=async(session)=>{
    try{
        console.log("StoreCallback")
        let data=session;
        data.onlineAccessInfo=JSON.stringify(session.onlineAccessInfo)


        if(data.id.indexOf(`${data.shop}`)> -1){
            domain_id=data.id;

        }


        console.log(session)

        const merchant_session=await MerchantSession.findOne({where:{shop:session.shop}})

        if(merchant_session){
            merchant_session.set({
                access_token:data.accessToken,
                state:data.state,
                scope:data.scope,
                domain_id:data.id,
                session_id:data.id,
                onlineAccessInfo:data.onlineAccessInfo,
                isOnline:data.isOnline

            })

            await merchant_session.save()
        }
        else{
            const new_merchant_session=await MerchantSession.build({
                shop:data.shop,
                access_token:data.accessToken,
                state:data.state,
                scope:data.scope,
                domain_id:data.id,
                session_id:data.id,
                onlineAccessInfo:data.onlineAccessInfo,
                isOnline:data.isOnline
            }) 

            await new_merchant_session.save()
        }

        return true;
    }catch(err){
        throw new Error(err);
    }

}



const loadCallBack=async(id)=>{
    try{
        let session=new Session(id)
        console.log(session)

        const merchantSession=await MerchantSession.findOne({where:{
            [Op.or]:[
                {session_id:id},
                {domain_id:id}
            ]

        }})

        console.log(merchantSession);

        session.shop=merchantSession[0].shop;
        session.state=merchantSession[0].state;
        session.scope=merchantSession[0].scope;
        session.isOnline=merchantSession[0].isOnline=='true'?'true':'false';
        session.onlineAccessInfo=merchantSession[0].onlineAccessInfo;
        session.access_token=merchantSession[0].access_token;
    
    
        const date=new Date();
        date.setDate(date.getDate()+1);
        session.expires=date;


        if(session.expires && typeof(session.expires)==='string'){
            session.expires=new Date(session.expires)
        }

        return session;
    }
    catch(e){
        console.log(e.message)
    }
}


const deleteCallBack=async(id)=>{
    try{

        await MerchantSession.destroy({
            where:{
                [Op.or]:[
                    {session_id:id},{domain_id:id}
                ]
            }

           
        })
        
        return true;
    }
    catch(err){
        throw new Error(err);
    }

}

module.exports.storeCallBack=storeCallBack
module.exports.loadCallBack=loadCallBack
module.exports.deleteCallBack=deleteCallBack
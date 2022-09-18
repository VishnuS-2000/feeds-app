require('dotenv').config()

const express=require('express')
const path=require('path')
const cookieParser=require('cookie-parser')

const {Shopify,LATEST_API_VERSION}=require('@shopify/shopify-api')
const {applyAuthMiddleware}=require('./middlewares/auth')
const {verifyRequest}=require('./middlewares/verifyRequest')

const {storeCallBack,loadCallBack,deleteCallBack}=require("./helpers/sessions")

const USE_ONLINE_TOKENS=true
const TOP_LEVEL_OAUTH_COOKIE="shopify_top_level_oauth"


//Initialize Shopify Context


Shopify.Context.initialize({
    API_KEY:process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY:process.env.SHOPIFY_APP_SECRET,
    SCOPES:process.env.SHOPIFY_SCOPES.split(','),
    HOST_NAME:process.env.HOST.replace(/https:\/\//, ""),
    API_VERSION:LATEST_API_VERSION,
    IS_EMBEDDED_APP:true,
    SESSION_STORAGE:new Shopify.Session.CustomSessionStorage(storeCallBack,loadCallBack,deleteCallBack)

})


const ACTIVE_SHOPIFY_SHOPS={};

Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED",{
    path:'/webhooks',
    webhookHandler:async(topic,shop,body)=>{
        delete ACTIVE_SHOPIFY_SHOPS[shop]

    }
})






const app=express()

app.set("top-level-oauth-cookie",TOP_LEVEL_OAUTH_COOKIE)
app.set("active-shopify-shops",ACTIVE_SHOPIFY_SHOPS)
app.set("use-online-tokens",USE_ONLINE_TOKENS)


app.use(cookieParser(Shopify.Context.API_SECRET_KEY));

applyAuthMiddleware(app)


app.post('/webhooks',async(req,res)=>{
    try{
        console.log("Started...")
        await Shopify.Webhooks.process.Registry.process(req,res);
        console.log("Webhooks Processed,returned status code 200")
    }
    catch(err){
        console.log(`Failed to process Webhook ${error}`)
        if(!res.headersSent){
            res.status(500).send(err.message)
        }
    }
})



//proxy for graphql api queries

app.post('/graphql',verifyRequest(app),async(req,res)=>{

    try{
        const response=await Shopify.Utils.graphqlProxy(req,res)
        res.status(200).send(respone.body)

    }
    catch(err){
        res.status(500).send(err.message)
    }

})



app.use(express.json())
app.use(express.urlencoded({extended:false}))


app.use(express.static(path.resolve(__dirname,"../client/build")))

app.use((req,res,next)=>{

    const shop=req.query.shop
    if(Shopify.Context.IS_EMBEDDED_APP&&shop){
        res.setHeader("Content-Security-Policy",`frame-ancestors https://${shop} https://admin.shopify.com;`);

    }
    else{
        res.setHeader("Content-Security-Policy",`frame-ancestors 'none';`);
    }
    next();
})

app.use("/*",async(req,res,next)=>{
    const {shop}=req.query;
 

    //Detect whether app needs reinstall by checking shop is undefined
    if(app.get("active-shopify-shops")[shop] === undefined && shop){

        res.redirect(`/auth?${new URLSearchParams(req.query).toString()}`);
    }
    else{
        next()
    }

});






app.get('/api/v1',(req,res)=>{
    res.status(200).json({'message':'Welcome to Feeds app by Carbo apps'})
})



app.use("/*",(req,res)=>{
    console.log("rendered")
    res.sendFile(path.resolve(__dirname,"../client/build","index.html"))
})

app.listen(4000,(req,res)=>{
    console.log("The server started on port 4000")
})
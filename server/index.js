require('dotenv').config()

const express=require('express')
const path=require('path')
const cookieParser=require('cookie-parser')

const {Shopify,LATEST_API_VERSION}=require('@shopify/shopify-api')
const {applyAuthMiddleware}=require('./middleware/auth')
const {verifyRequest}=require('./middleware/verifyRequest')

const {storeCallBack,loadCallBack,deleteCallBack}=require("./helpers/session")

const USE_ONLINE_TOKENS=true
const TOP_LEVEL_AUTH_COOKIE='shopify_top_level_oauth'

//Initialize Shopify Context
Shopify.Context.initialize({
    API_KEY:process.env.SHOPIFY_API_KEY,
    API_SECRET_KEY:process.env.SHOPIFY_APP_SECRET,
    SCOPES:process.env.SHOPIFY_SCOPES.split(','),
    HOST_NAME:process.env.HOST_NAME.replace(/https:\/\//, ""),
    API_VERSION:LATEST_API_VERSION,
    IS_EMBEDDED_APP:true,
    SESSION_STORAGE:new Shopify.CustomSessionStorage(loadCallBack,storeCallBack,deleteCallBack)

})


const ACTIVE_SHOPIFY_SHOPS={};

Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED",{
    path:'/webhooks',
    webhookHandler:async(topic,shop,body)=>{
        delete ACTIVE_SHOPIFY_SHOPS[shop]

    },
})





const app=express()

app.set("top-level-oauth-cookie",TOP_LEVEL_AUTH_COOKIE)
app.set("active-shopify-shops",ACTIVE_SHOPIFY_SHOPS)
app.set("use-online-tokens",USE_ONLINE_TOKENS)


app.use(cookieParser(Shopify.Context.API_SECRET_KEY));

applyAuthMiddleware(app)


app.post('/webhooks',async(req,res)=>{
    try{
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


app.use(express.static(path.resolve(__dirname,"../client/build")))
app.use(express.json())

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

app.use("/*",(req,res,next)=>{
    const {shop}=req.query;


    //Detect whether app needs reinstall by checking shop is undefined
    if(app.get("active-shopify-shops")[shop]==undefined&&shop){
        res.redirect(`/auth?${new URLSearchParams(req.query).toString()}`);
    }
    else{
        next()
    }

});



app.get('/api/v1',(req,res)=>{
    res.status(200).json({'message':'Welcome to Feeds-appv1.0'})
})


app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"../client/build","index.html"))
})

app.listen(4000,(req,res)=>{
    console.log("The server started on port 4000")
})
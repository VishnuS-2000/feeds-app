const {Shopify}=require("@shopify/shopify-api")

const {topLevelAuthRedirect}=require('../helpers/topLevelRedirect');

function applyAuthMiddleware(app){
    app.get("/auth",async(req,res)=>{

     
        if(!req.signedCookies[app.get("top-level-oauth-cookie")])
        {
            console.log("no-cookie")
            return res.redirect(
                `/auth/toplevel?${new URLSearchParams(req.query).toString()}`
              );

    }


        const redirectUrl=await Shopify.Auth.beginAuth(
            req,res,req.query.shop,
            "/auth/callback",
            app.get("use-online-tokens")
        );
        

    res.redirect(redirectUrl)
    })


    app.get('/auth/toplevel',(req,res)=>{
        console.log("In Toplevel route")
        try{  
            console.log("cookie-set")
        res.cookie(app.get("top-level-oauth-cookie"),"1",{
            signed:true,
            httpOnly:true,
            sameSite:"strict"
        })
 

        res.set("Content-Type","text/html");
        console.log("Reached Here")
        res.send(topLevelAuthRedirect({
            apiKey:Shopify.Context.apiKey,
            hostName:Shopify.Context.hostName,
            host:req.query.host,
            query:req.query
        })

        );
    }
    catch(err){
        console.log(err)
    }

    });

    app.get("/auth/callback",async(req,res)=>{
        try{
            console.log("In Auth Callback")
            const session=await Shopify.Auth.validateAuthCallback(
                req,res,req.query
            );
        
            const host=req.query.host;
            app.set("active-shopify-shops",Object.assign(app.get("active-shopify-shops"),{
                [session.shop]:session.scope,
            }))

            const response=await Shopify.Webhooks.Registry.register({
                shop:session.shop,
                accessToken:Shopify.accessToken,
                topic:"APP_UNINSTALLED",
                path:'/webhooks'
            });

            if(!response["APP_UNINSTALLED"].success){
                console.log(`Failed to register APP_UNINSTALLED webhook :${respone.result}`);

            }
            res.redirect(`/shop?${session.shop}&host=${host}`)


        }catch(err)
        {
            switch(true){
                case err instanceof Shopify.Errors.InvalidOAuthError:
                    res.status(400)
                    res.send(e.message)
                    break;
                case err instanceof Shopify.Errors.CookieNotFound:
                case err instanceof Shopify.Errors.SessionNotFound:
                    res.redirect(`/auth?shop=${req.query.shop}`)
                    break;
                default:
                    res.status(500)
                    res.send(err.message)
                    break;
            }

        }
    });

}

module.exports.applyAuthMiddleware=applyAuthMiddleware;
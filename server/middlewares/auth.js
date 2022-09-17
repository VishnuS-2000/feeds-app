import {Shopify} from "@shopify/shopify-api"

import topLevelAuthRedirect from '../helpers/topLevelRedirect';

export function applyAuthMiddleware(app){
    app.get("/auth",async(req,res)=>{
        if(!req.signedCookies[app.get("top-level-oauth-cookie")])
        return res.redirect(`
        /auth/toplevel?${new URLSearchParams(req.query).toString()}
        `)
    })
}
import { betterAuth } from "better-auth";
import { authDb } from "./database.js";
import { admin, organization } from "better-auth/plugins";
import { expo } from "@better-auth/expo";



export const auth = betterAuth({
    database: authDb,

    emailAndPassword:{
        enabled: true
    },


    user: {
        additionalFields: {
            platformRole: {
                type: 'string',
                required: false,
                default: 'user',
                input: false
            }
        }
    },



    trustedOrigins: [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ],


    plugins:[
        expo(),
        organization(),
        admin()
    ]
})


export type AppUserSession = typeof auth.$Infer.Session;
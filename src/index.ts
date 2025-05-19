import express from 'express'
import { MINT_ADDRESS, PRIVATE_KEY, PUBLIC_KEY, TOKEN_CREATION_TIMESTAMP } from './constants'
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import dotenv from 'dotenv'
import {
    getBase58Encoder
  } from "@solana/kit";
  
  
const app = express()
dotenv.config()

app.use(express.json())

const dummyResponse = {
    "accountData": [
        { "account": "6GrHdFDmyR2ozzcbckH37XZufrVKkDhgSEofcyVnjubX", "nativeBalanceChange": -1000080000, "tokenBalanceChanges": [] },
        { "account": "9Qj3Su5uijFa6NPqHHRrRiFfJ8oKTZMjHqDQQ7oeJkwN", "nativeBalanceChange": 1000000000, "tokenBalanceChanges": [] },
        { "account": "11111111111111111111111111111111", "nativeBalanceChange": 0, "tokenBalanceChanges": [] },
        { "account": "ComputeBudget111111111111111111111111111111", "nativeBalanceChange": 0, "tokenBalanceChanges": [] }
    ],
    "description": "6GrHdFDmyR2ozzcbckH37XZufrVKkDhgSEofcyVnjubX transferred 1 SOL to 9Qj3Su5uijFa6NPqHHRrRiFfJ8oKTZMjHqDQQ7oeJkwN.",
    "events": [],
    "fee": 80000,
    "feePayer": "6GrHdFDmyR2ozzcbckH37XZufrVKkDhgSEofcyVnjubX",
    "instructions": [
        { "accounts": [], "data": "3b1H8Rq1T3d1", "innerInstructions": [], "programId": "ComputeBudget111111111111111111111111111111" },
        { "accounts": [], "data": "LKoyXd", "innerInstructions": [], "programId": "ComputeBudget111111111111111111111111111111" },
        { "accounts": ["6GrHdFDmyR2ozzcbckH37XZufrVKkDhgSEofcyVnjubX", "9Qj3Su5uijFa6NPqHHRrRiFfJ8oKTZMjHqDQQ7oeJkwN"], "data": "3Bxs3zzLZLuLQEYX", "innerInstructions": [], "programId": "11111111111111111111111111111111" }
    ],
    "nativeTransfers": [
        { "amount": 1000000000, "fromUserAccount": "6GrHdFDmyR2ozzcbckH37XZufrVKkDhgSEofcyVnjubX", "toUserAccount": "9Qj3Su5uijFa6NPqHHRrRiFfJ8oKTZMjHqDQQ7oeJkwN" }
    ],
    "signature": "oYphNJSpUjE7j2YB4b1YuYRbcvMDWePU5MuegcbA3oEt4rN74xuJKaXxFw5nLMRgU6gtTSiL8vRDkacCoSciSB1",
    "slot": 381749903,
    "source": "SYSTEM_PROGRAM",
    "timestamp": 1747596406,
    "tokenTransfers": [],
    "transactionError": null,
    "type": "TRANSFER"
}
/* Formula thinking

    1 SOL = 1 my token (Initially)
    Let's say my token grows 4% every hour (Mission of making the most liquid token😂)
    i.e
    After 1 hour
    1 SOL = 0.96 my token
    After 2 hours
    1 SOL = 0.9216 my token
    After 3 hours
    1 SOL = 0.8847 my token

    // After 17 hours
    1 SOL = 0.4995 my token (My token is double the value of 1 SOL after 17 hours)
    i.e If you want 1 my token, then you have to pay 2 SOL now


    So my formula would look something like this WHEN USER WANTS TO GET MY TOKEN (Will find something better later)

    hoursPassed = getHours(TOKEN_CREATION_TIMESTAMP - currentTimestamp)
    amount = 1
    for(let i = 0; i < hoursPassed; i++) {
        amount = amount / 1.04
    }

    sendAmount = receivedSOL * amount
    send(sendAmount)


    WHEN USER WANTS TO SEND MY TOKEN (Will find something better later)

    hoursPassed = getHours(TOKEN_CREATION_TIMESTAMP - currentTimestamp)
    amount = 1
    for(let i = 0; i < hoursPassed; i++) {
        amount = amount * 1.04
    }

    sendAmountInSOL = receivedMyToken * amount
    send(sendAmountInSOL)
*/
async function mintAndSendMyToken(toAccount: string, amount: number) {
    console.log("toAccount", toAccount)
    const connection = new Connection("https://api.devnet.solana.com")
    // const payer = Keypair.fromSecretKey(Uint8Array.from(process.env.PRIVATE_KEY!))
    const keypairBase58 = PRIVATE_KEY!;
  
    const privateUInt8Array = getBase58Encoder().encode(keypairBase58)
    // @ts-ignore
    const payer = Keypair.fromSecretKey(privateUInt8Array)
        
    console.log("payer", payer.publicKey)
    const ATA = await getOrCreateAssociatedTokenAccount(connection, payer, new PublicKey(MINT_ADDRESS), new PublicKey(toAccount))
    console.log("ATA", ATA)
    // Formula comes here
    const currentTimestamp = Date.now()
    const hoursPassed = (currentTimestamp - Date.parse(TOKEN_CREATION_TIMESTAMP)) / 3600000
    console.log("User sent",amount, "Lamports of SOL" )
    for(let i = 1; i <= hoursPassed; i++) {
        amount = amount / 1.04
    }
    amount = parseInt(amount.toString())
    console.log("hoursPassed", hoursPassed)
    console.log("Now user will receive",amount, "Lamports of my token" )
    const mintTxn = await mintTo(connection, payer, new PublicKey(MINT_ADDRESS), ATA.address, payer.publicKey,amount ) // Assuming 1 SOL = 1 my token. Later this equation will be changed according to the formula
    console.log("mintTxn", mintTxn)
    return
    
}

app.post("/listen-webhook", (req, res) => {
    console.log('body', req.body)
    const fromAccount = dummyResponse.nativeTransfers[0].fromUserAccount
    const toAccount = dummyResponse.nativeTransfers[0].toUserAccount
    const amount = dummyResponse.nativeTransfers[0].amount
    console.log("fromAccount", fromAccount)
    console.log("toAccount", toAccount)
    console.log("PUBLIC_KEY", PUBLIC_KEY)
    if(toAccount != PUBLIC_KEY) {
        console.log("Token not sent to my public key")
        res.send("Token not sent to my public key")
        return
    }
    console.log("Token sent to my public key")
    mintAndSendMyToken(fromAccount, amount)
    res.send("Token sent to my public key")
    // res.send("webhook hit")

})

app.listen(3000, () => {
    console.log("Server running on port 3000")
})
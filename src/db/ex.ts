import { configDotenv } from "dotenv"
// import pg from "pg"
// const { Client } = pg
configDotenv()
import postgres from "postgres"

//const cl = new Client({
    // connectionString: process.env.DATABASE_URL,
//})

const sql = postgres(process.env.DATABASE_URL as string)

const wait = async () => {
    // await cl.connect()
    // const res = await cl.query("CREATE TABLE users(id integer, nameg varchar(255))")
    // console.log(res)
    // await cl.end()
    const xs = await sql`
        select
        *
        from
        app_user
    `
    console.log(xs)
    return
}

wait()

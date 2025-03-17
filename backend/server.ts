import {
  generateSessionToken,
  createSession,
  validateSessionToken,
  SessionValidationResult,
  invalidateSession,
  invalidateAllSessions
} from "./sessionApi.ts";
import { db } from "../src/db/index.ts";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const csrfProtection = (req, res, next): void => {
  const origin = req.headers["origin"] || req.headers["referer"];
    console.log(origin)
  if (!origin || !origin.startsWith("http://localhost:5173")) {
    return res
      .status(403)
      .json({ success: false, message: "CSRF protection: Invalid origin", source: origin });
  }

  next();
};

app.get("/genToken", async (req, res) => {
  const token = generateSessionToken()
  return res.status(200).json({success: true, message: "Token generated", token})
})

app.post("/validateToken", async (req, res) => {
  const {token} = req.body
  const resp = await validateSessionToken(token)
  res.status(200).json({ success: true, message: "Valid Token", details: resp})
})

app.post("/invalidateSession", async (req, res) => {
  const { sessionId } = req.body
  await invalidateSession(sessionId)
  res.status(200).json({ success: true, message: "Session Deleted"})
})

app.post("/test", async (req, res, next) => {
  try {
    const {token} = req.body
    console.log(token)
    console.log("got token", token)
    const stat = await createSession(token, 1)
    console.log("create Session")
    console.log("set cookie")
    const {session, user} = await validateSessionToken(token)
    console.log(session, user)
    if (!session || !user) {
      return
    }

    console.log("done")
    return res
      .status(200)
      .json({ success: true, message: "User session generated", session: session});
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  console.log(username, password);
  //TODO register the user and add to app_user and user_password and make sure it is unique
  return res
    .status(200)
    .json({ success: true, message: "User has been registered" });
});

app.post("/login", csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;
    const query = {
      text: "SELECT * FROM app_user",
    };

    //TODO check if user password is valid

    const stat = await db.query("SELECT id FROM app_user WHERE username = $1", [
      username,
    ]);

    if (stat.rowCount === 0) {
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const userId = stat.rows[0].id;
    const details = await createSession(generateSessionToken(), userId);
    return res
      .status(200)
      .json({
        success: true,
        message: "Session Created",
        sessionId: details.id,
      });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Internal Server Error" });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));

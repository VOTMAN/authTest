import { Link } from "react-router-dom";
import { getCookie, removeCookie, setCookie } from "typescript-cookie";
import { useState } from "react";
import { invalidateSession, validateSessionToken } from "../backend/sessionApi";


export function Signup() {
  const [token, setToken] = useState(getCookie("session") || null)

  async function setSessionTokenCookie(
    token: string,
    expiresAt: Date
  ): Promise<void> {
    
    setCookie("session", token, {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: expiresAt,
      path: "/",
    })
  }

  async function deleteSessionTokenCookie(): Promise<void> {
    removeCookie("session", { path: "/" })
  }

  const generateToken = async () => {
    try {
      const req = await fetch("http://localhost:3001/genToken", {
        method: "GET",
        headers: {
          'Content-Type': "application/json"
        }
      })
      const res = await req.json()
      return res
    } catch (err) {
      console.log(err)
    }
  }
  const handleSignup = async () => {
      const tokenData = await generateToken()
      const token = tokenData.token
      const req = await fetch("http://localhost:3001/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tokenData),
      });
    const res = await req.json();
    if (!res.success) {
      console.log("Something went wrong")
      return
    }
    
    console.log(res.session.expiresAt)
    const expiresAt = Date.parse(res.session.expiresAt)
    setToken(token)
    await setSessionTokenCookie(token, new Date(expiresAt))
    console.log("Cookie Set", getCookie("session"))

  };
  const handleLogout = async () => {
    if (token === null) {
      alert("Already logged out")
      return
    }
    // await deleteSessionTokenCookie()
    let res = await fetch("http://localhost:3001/validateToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({token})
    })
    const resp = await res.json()
    console.log(resp)
    const sessionId = resp.details.session.id;
    res = await fetch("http://localhost:3001/invalidateSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({sessionId})
    })
    await deleteSessionTokenCookie()
    setToken(null)
    alert("Logged Out")
  }
  return (
    <div className="flex h-screen w-screen justify-center algin-center">
      <div className="">
        <h1>Signup Page</h1>
        <button onClick={() => handleSignup()} className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">Signup</button>
        <button onClick={() => handleLogout()} className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">Logout</button>
        <Link to="/" className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">Home</Link>
      </div>
    </div>
  );
}

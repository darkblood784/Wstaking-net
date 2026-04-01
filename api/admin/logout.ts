export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        ok: false,
        authenticated: false,
        message: "Method not allowed",
      });
    }

    const isSecure = process.env.NODE_ENV === "production";
    const cookie = [
      "wstaking_admin_session=",
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Max-Age=0",
      isSecure ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      ok: true,
      authenticated: false,
      message: "Admin session cleared",
    });
  } catch (error: any) {
    console.error("admin/logout failed:", error);
    return res.status(500).json({
      ok: false,
      authenticated: false,
      message: `Logout failed: ${error?.message || "unknown error"}`,
    });
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

export const runtime = 'nodejs'
export const maxDuration = 30 // Timeout de 30 secondes

export async function POST(request: NextRequest) {
  console.log("[send-credentials] API called")
  
  try {
    const body = await request.json()
    console.log("[send-credentials] Body received:", { 
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      username: body.username,
      hasPassword: !!body.password
    })

    const { recipientEmail, recipientName, username, password, userType } = body

    // Validation
    if (!recipientEmail || !recipientName || !username || !password) {
      console.log("[send-credentials] Missing fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Vérifier que la clé API est présente
    if (!process.env.RESEND_API_KEY) {
      console.error("[send-credentials] RESEND_API_KEY not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    console.log("[send-credentials] Sending email to:", recipientEmail)

    // Send email using Resend avec timeout
    const { data, error } = await resend.emails.send({
      from: "EduPlan <noreply@eduplan-lnc.com>",
      to: recipientEmail,
      subject: "Vos identifiants de connexion - EduPlan",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Identifiants de connexion - EduPlan</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">EduPlan</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Gestion de plans de classe</p>
            </div>
            
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #10b981; margin-top: 0;">Bonjour ${recipientName},</h2>
              
              <p>Vos identifiants de connexion à <strong>EduPlan</strong> ont été créés avec succès.</p>
              
              <div style="background: white; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
                <h3 style="margin-top: 0; color: #10b981;">Vos identifiants</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Identifiant :</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; background: #f5f5f5; padding: 8px 12px; border-radius: 4px;">${username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #555;">Mot de passe :</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; background: #f5f5f5; padding: 8px 12px; border-radius: 4px;">${password}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>Important :</strong> Conservez ces identifiants en lieu sûr. Vous pouvez modifier votre mot de passe après votre première connexion.
                </p>
              </div>
              
              <h3 style="color: #10b981;">Comment se connecter ?</h3>
              <ol style="color: #555; padding-left: 20px;">
                <li style="margin: 10px 0;">Rendez-vous sur la plateforme EduPlan</li>
                <li style="margin: 10px 0;">Entrez le code de votre établissement</li>
                <li style="margin: 10px 0;">Sélectionnez votre rôle</li>
                <li style="margin: 10px 0;">Saisissez votre identifiant et votre mot de passe</li>
              </ol>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                Si vous rencontrez des difficultés, contactez votre vie scolaire.
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>Email envoyé automatiquement par EduPlan</p>
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("[send-credentials] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[send-credentials] Email sent successfully:", data)
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error("[send-credentials] Exception:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

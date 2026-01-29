import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

async function testResend() {
  console.log("[v0] Testing Resend configuration...")
  console.log("[v0] API Key:", process.env.RESEND_API_KEY ? "Configured ✅" : "Missing ❌")

  try {
    // Test 1: Send a test email
    console.log("[v0] Sending test email...")
    const { data, error } = await resend.emails.send({
      from: "noreply@nerium-lnc.com", // Changez si nécessaire
      to: "votre-email@example.com", // Mettez votre email pour tester
      subject: "Test Resend Configuration",
      html: "<p>Si vous recevez cet email, Resend fonctionne correctement! ✅</p>",
    })

    if (error) {
      console.error("[v0] Error sending email:", error)
      return
    }

    console.log("[v0] Email sent successfully! ✅")
    console.log("[v0] Email ID:", data?.id)

    // Test 2: List domains
    console.log("[v0] Checking domains...")
    const domains = await resend.domains.list()
    console.log("[v0] Domains:", domains)
  } catch (error) {
    console.error("[v0] Test failed:", error)
  }
}

testResend()

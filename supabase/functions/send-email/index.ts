import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
// We use the Service Role Key to bypass RLS (Permission) issues
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // 1. Handle CORS (Security handshake)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email, type, message, name, subject } = await req.json()

        // ------------------------------------------------------------------------
        // SCENARIO A: WAITLIST (Save to DB + Email User)
        // ------------------------------------------------------------------------
        if (type === 'waitlist') {
            if (!email) throw new Error('Email is missing')

            // A1. Check for Duplicate Email (Case-insensitive)
            const { data: existingData, error: checkError } = await supabase
                .from('waitlist')
                .select('email')
                .ilike('email', email)
                .limit(1)

            if (checkError) throw new Error('Database check error: ' + checkError.message)

            if (existingData && existingData.length > 0) {
                return new Response(JSON.stringify({ error: 'You are already in the queue for the waitlist! 🚀' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 409, // Conflict
                })
            }

            // A2. Save to Database (using Admin privileges)
            const { error: dbError } = await supabase
                .from('waitlist')
                .insert([{ email: email }])

            if (dbError) throw new Error('Database error: ' + dbError.message)

            // A3. Send Confirmation to User
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'RingLink <support@ringlinkalarm.com>',
                    to: email,
                    subject: 'You are on the list! 🚀',
                    html: `<p>Thanks for joining RingLink! We will notify you when the beta is ready.</p>`
                }),
            })

            return new Response(JSON.stringify({ message: 'Joined waitlist' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // ------------------------------------------------------------------------
        // SCENARIO B: CONTACT FORM (Email You + Auto-reply to User)
        // ------------------------------------------------------------------------
        if (type === 'contact') {
            // B1. Email YOU (The Team) with the message details
            // REPLACE THIS WITH YOUR REAL EMAIL
            const YOUR_EMAIL = 'support@ringlinkalarm.com'

            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'RingLink Contact <support@ringlinkalarm.com>',
                    to: YOUR_EMAIL,
                    subject: `New Message: ${subject || 'No Subject'}`,
                    html: `
                    <h3>New Contact Form Submission</h3>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong><br/>${message}</p>
                `
                }),
            })

            // B2. Auto-reply to USER ("We got your message")
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: 'RingLink Support <support@ringlinkalarm.com>',
                    to: email,
                    subject: 'We received your message 📬',
                    html: `<p>Hi ${name},</p><p>Thanks for reaching out. We have received your message and will get back to you shortly!</p><p>- The RingLink Team</p>`
                }),
            })

            return new Response(JSON.stringify({ message: 'Message sent' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
# Supabase SMTP Setup with SendGrid

This guide explains how to configure Supabase to use SendGrid as a custom SMTP provider for authentication emails (confirmation, password reset, magic links, etc.).

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Configure Custom SMTP in Supabase Dashboard](#configure-custom-smtp-in-supabase-dashboard)
4. [SendGrid SMTP Settings](#sendgrid-smtp-settings)
5. [Customize Email Templates](#customize-email-templates)
6. [Example Email Templates with Raven Branding](#example-email-templates-with-raven-branding)
7. [Testing Your Setup](#testing-your-setup)
8. [Troubleshooting](#troubleshooting)

---

## Overview

By default, Supabase provides a simple SMTP server for testing, but it has significant limitations:
- Only sends to pre-authorized team members
- Rate limited to 30 emails per hour
- Not suitable for production use

For production applications, you should configure a custom SMTP server like SendGrid to ensure reliable email delivery.

---

## Prerequisites

- Supabase project (hosted or self-hosted)
- SendGrid account with API key
- Verified sender domain in SendGrid
- Your SendGrid API Key stored in `.env.local` as `SENDGRID_API_KEY`
- Verified from email: `jobs@raven-search.com`

---

## Configure Custom SMTP in Supabase Dashboard

### Step 1: Navigate to Authentication Settings

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Settings** (or go directly to `/dashboard/project/_/settings/auth`)

### Step 2: Enable Custom SMTP

Scroll down to the **SMTP Settings** section and enable **Enable Custom SMTP**.

### Step 3: Configure SMTP Settings

Fill in the following fields:

| Field | Value | Description |
|-------|-------|-------------|
| **Sender Email** | `jobs@raven-search.com` | The "from" email address for all auth emails |
| **Sender Name** | `Raven` | The sender name that appears in the inbox |
| **Host** | `smtp.sendgrid.net` | SendGrid's SMTP server |
| **Port Number** | `587` | Use 587 for TLS (recommended) or 465 for SSL |
| **Username** | `apikey` | Literally the word "apikey" (SendGrid requirement) |
| **Password** | `[Your SendGrid API Key]` | Your actual SendGrid API key from `.env.local` |

### Step 4: Save Settings

Click **Save** to apply the SMTP configuration.

---

## SendGrid SMTP Settings

### Complete SendGrid Configuration

```
Host: smtp.sendgrid.net
Port: 587 (TLS) or 465 (SSL)
Username: apikey
Password: [Your SendGrid API Key]
```

### Important Notes

1. **Username is always "apikey"**: SendGrid requires the literal string "apikey" as the username, not your actual API key.
2. **Password is your API Key**: Use your actual SendGrid API key (starts with `SG.`) as the password.
3. **Use TLS (Port 587)**: This is the recommended port for most applications.
4. **SSL (Port 465)**: Alternative if your environment requires SSL.

### Rate Limits

After configuring custom SMTP:
- Default rate limit: 30 messages per hour (for protection)
- To increase: Go to **Authentication** > **Rate Limits** in your Supabase dashboard
- Adjust based on your SendGrid plan and expected email volume

---

## Customize Email Templates

Supabase provides several authentication email templates that you can customize with Raven branding.

### Available Email Templates

Navigate to **Authentication** > **Email Templates** in your Supabase dashboard to customize:

1. **Confirm signup** - Email verification for new registrations
2. **Invite user** - User invitation emails
3. **Magic Link** - Passwordless authentication links
4. **Change Email Address** - Email change verification
5. **Reset Password** - Password recovery emails

### Template Variables

Use these variables in your email templates:

| Variable | Description |
|----------|-------------|
| `{{ .ConfirmationURL }}` | Full confirmation URL with token |
| `{{ .Token }}` | 6-digit OTP code (alternative to URL) |
| `{{ .TokenHash }}` | Hashed token for custom URLs |
| `{{ .SiteURL }}` | Your application's site URL |
| `{{ .RedirectTo }}` | Redirect URL after confirmation |
| `{{ .Email }}` | User's email address |
| `{{ .NewEmail }}` | New email (for email change templates) |

### Customization Steps

1. Go to **Authentication** > **Email Templates** in dashboard
2. Select the template you want to customize
3. Edit the **Subject** line
4. Edit the **Email Body** HTML
5. Click **Save** to apply changes

---

## Example Email Templates with Raven Branding

### 1. Confirm Signup Template

**Subject:**
```
Confirm your Raven account
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                                Welcome to Raven
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Thank you for signing up! Please confirm your email address to get started with Raven.
                            </p>
                            <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Click the button below to verify your account:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #0066ff;">
                                        <a href="{{ .ConfirmationURL }}"
                                           style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                                            Confirm Your Email
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                Or use this verification code: <strong style="color: #1a1a1a; font-size: 18px;">{{ .Token }}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                If you didn't create a Raven account, you can safely ignore this email.
                            </p>
                            <p style="margin: 10px 0 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                &copy; 2024 Raven. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### 2. Password Reset Template

**Subject:**
```
Reset your Raven password
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                                Reset Your Password
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your Raven account password.
                            </p>
                            <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Click the button below to choose a new password:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #0066ff;">
                                        <a href="{{ .ConfirmationURL }}"
                                           style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                Or use this verification code: <strong style="color: #1a1a1a; font-size: 18px;">{{ .Token }}</strong>
                            </p>
                            <p style="margin: 20px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                This link will expire in 1 hour for security reasons.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
                            </p>
                            <p style="margin: 10px 0 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                &copy; 2024 Raven. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### 3. Magic Link Template

**Subject:**
```
Your Raven sign-in link
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Magic Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                                Sign In to Raven
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Click the button below to securely sign in to your Raven account:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #0066ff;">
                                        <a href="{{ .ConfirmationURL }}"
                                           style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                                            Sign In to Raven
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                Or use this one-time code: <strong style="color: #1a1a1a; font-size: 18px;">{{ .Token }}</strong>
                            </p>
                            <p style="margin: 20px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                This link will expire in 1 hour.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                If you didn't request this sign-in link, you can safely ignore this email.
                            </p>
                            <p style="margin: 10px 0 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                &copy; 2024 Raven. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

### 4. Email Change Confirmation Template

**Subject:**
```
Confirm your new Raven email address
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email Change</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 28px; font-weight: 600;">
                                Confirm Email Change
                            </h1>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 20px 40px;">
                            <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                You requested to change your Raven account email address to: <strong>{{ .NewEmail }}</strong>
                            </p>
                            <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Click the button below to confirm this change:
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 0 auto;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #0066ff;">
                                        <a href="{{ .ConfirmationURL }}"
                                           style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">
                                            Confirm Email Change
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 30px 0 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                Or use this verification code: <strong style="color: #1a1a1a; font-size: 18px;">{{ .Token }}</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                If you didn't request this email change, please contact support immediately.
                            </p>
                            <p style="margin: 10px 0 0; color: #8a8a8a; font-size: 13px; line-height: 1.5;">
                                &copy; 2024 Raven. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Testing Your Setup

### 1. Test Email Delivery

After configuring SMTP:

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Try to sign up a new test user with your email address
3. Check your inbox for the confirmation email
4. Verify the email displays correctly with Raven branding

### 2. Test Different Email Types

Test each authentication flow:

- **Sign up**: Create a new account
- **Password reset**: Request a password reset
- **Magic link**: Try passwordless sign-in
- **Email change**: Update email address

### 3. Check Email Deliverability

Monitor your SendGrid dashboard for:
- Email delivery status
- Open rates
- Bounce rates
- Spam reports

---

## Troubleshooting

### Common Issues

#### Emails Not Sending

**Problem**: Emails are not being delivered

**Solutions**:
1. Verify SendGrid API key is correct
2. Check that username is exactly `apikey` (not your actual key)
3. Confirm sender email is verified in SendGrid
4. Check SendGrid dashboard for errors
5. Verify port 587 or 465 is not blocked by your firewall

#### Rate Limit Errors

**Problem**: "Rate limit exceeded" errors

**Solutions**:
1. Go to **Authentication** > **Rate Limits** in Supabase dashboard
2. Increase the email rate limit
3. Check your SendGrid plan limits
4. Consider upgrading SendGrid plan if needed

#### Emails Going to Spam

**Problem**: Authentication emails landing in spam folder

**Solutions**:
1. Configure SPF, DKIM, and DMARC records in SendGrid
2. Verify sender domain authentication
3. Avoid promotional content in auth emails
4. Use consistent branding and simple templates
5. Keep content focused on authentication only

#### Template Variables Not Working

**Problem**: Variables like `{{ .Token }}` showing as plain text

**Solutions**:
1. Ensure you're using the correct Go template syntax
2. Check for typos in variable names (case-sensitive)
3. Test with a simple template first
4. Verify template is saved correctly in dashboard

---

## Best Practices

### Email Security

1. **Enable DKIM and SPF**: Configure in SendGrid to improve deliverability
2. **Use verified domains**: Verify `raven-search.com` in SendGrid
3. **Monitor bounce rates**: Regularly check SendGrid analytics
4. **Implement CAPTCHA**: Protect sign-up forms from abuse

### Email Content

1. **Keep it simple**: Focus on authentication, avoid marketing
2. **Clear CTAs**: Make action buttons prominent
3. **Mobile-friendly**: Test on mobile devices
4. **Consistent branding**: Use Raven colors and style
5. **Provide alternatives**: Include both links and OTP codes

### Performance

1. **Monitor rate limits**: Adjust based on usage patterns
2. **Set up alerts**: Configure SendGrid alerts for failures
3. **Test regularly**: Verify all email flows work correctly
4. **Have a backup**: Consider configuring a secondary SMTP provider

---

## Additional Resources

- [Supabase Auth SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SendGrid SMTP Documentation](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp)
- [SendGrid Domain Authentication](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)

---

## Support

For issues or questions:
- Supabase Support: [supabase.com/support](https://supabase.com/support)
- SendGrid Support: [support.sendgrid.com](https://support.sendgrid.com)
- Raven Internal: Contact the development team

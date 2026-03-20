const express = require('express')
const jwt     = require('jsonwebtoken')
const crypto  = require('crypto')
const nodemailer = require('nodemailer')
const User    = require('../models/User')
const Company = require('../models/Company')
const auth    = require('../middleware/auth')

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

// Send password reset email
const sendResetEmail = async (email, resetUrl) => {
  try {
    await transporter.sendMail({
      from: `"StockFlow Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Password Reset - StockFlow Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">StockFlow Pro</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password. Click the button below to create a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
      `
    })
    return true
  } catch (err) {
    console.error('Email send error:', err)
    return false
  }
}

const router = express.Router()

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30d' })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body
    if (!username?.trim() || !password?.trim())
      return res.status(400).json({ error: 'Username and password are required' })

    const exists = await User.findOne({ username: username.trim().toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Username already taken' })

    const user = await User.create({ 
      username: username.trim().toLowerCase(), 
      password, 
      name: name?.trim() || username.trim(),
      email: email?.trim() || '' 
    })

    // Auto-create empty company profile
    await Company.create({ userId: user._id })

    const token = signToken(user)
    res.status(201).json({ token, user: { id: user._id, username: user.username, name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username?.trim() || !password?.trim())
      return res.status(400).json({ error: 'Username and password are required' })

    const user = await User.findOne({ username: username.trim().toLowerCase() })
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ error: 'Invalid username or password' })

    // Ensure company profile exists
    await Company.findOneAndUpdate(
      { userId: user._id },
      { $setOnInsert: { userId: user._id } },
      { upsert: true, new: true }
    )

    const token = signToken(user)
    res.json({ token, user: { id: user._id, username: user.username, name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me (legacy - kept for backward compatibility)
// Note: There's a newer /me endpoint below that fetches from database
router.get('/me', auth, (req, res) => {
  res.json({ id: req.user._id, username: req.user.username, name: req.user.name, email: req.user.email, createdAt: req.user.createdAt })
})

// GET /api/auth/test-email - Test email configuration
router.get('/test-email', async (req, res) => {
  try {
    console.log('Testing email configuration...')
    console.log('EMAIL_USER:', process.env.EMAIL_USER)
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS)
    console.log('EMAIL_PASS value:', process.env.EMAIL_PASS?.substring(0, 4) + '...')
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') {
      return res.json({ 
        status: 'not_configured', 
        message: 'Email not configured. Add EMAIL_USER and EMAIL_PASS in .env file.' 
      })
    }
    
    // Try to send test email
    await transporter.sendMail({
      from: `"StockFlow Pro" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,  // Send to yourself
      subject: 'Test Email - StockFlow Pro',
      html: '<h1>Test Email</h1><p>Email configuration is working!</p>'
    })
    
    res.json({ status: 'success', message: 'Test email sent to ' + process.env.EMAIL_USER })
  } catch (err) {
    console.error('Test email error:', err.message)
    res.json({ status: 'error', message: err.message })
  }
})

// POST /api/auth/forgot-password - Generate new password and send to email
router.post('/forgot-password', async (req, res) => {
  try {
    const { username, email } = req.body
    if (!username?.trim() && !email?.trim()) {
      return res.status(400).json({ error: 'Username or email is required' })
    }

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [
        { username: username?.trim().toLowerCase() },
        { email: email?.trim().toLowerCase() }
      ]
    })
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If username exists, new password has been sent to your email' })
    }

    // Generate new random password
    const newPassword = Math.random().toString(36).slice(-8)
    user.password = newPassword
    await user.save()

    const userEmail = user.email || email?.trim()
    
    // Send email with new password
    let emailSent = false
    let emailError = ''
    
    console.log('Email config check:', {
      hasUser: !!process.env.EMAIL_USER,
      hasPass: !!process.env.EMAIL_PASS,
      passValue: process.env.EMAIL_PASS?.substring(0, 4) + '...',
      userEmail: !!userEmail
    })
    
    if (userEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password_here') {
      // Send new password via email
      try {
        const info = await transporter.sendMail({
          from: `"StockFlow Pro" <${process.env.EMAIL_USER}>`,
          to: userEmail,
          subject: '🔐 New Password - StockFlow Pro',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">StockFlow Pro</h1>
              </div>
              <div style="padding: 30px; background: #f9f9f9;">
                <h2 style="color: #333;">Your New Login Details</h2>
                <p style="color: #666; line-height: 1.6;">
                  We have generated a new password for your account. Here are your login details:
                </p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #ddd;">
                  <p style="margin: 10px 0;"><strong>Username:</strong> ${user.username}</p>
                  <p style="margin: 10px 0;"><strong>New Password:</strong> <span style="font-size: 18px; color: #667eea; font-weight: bold;">${newPassword}</span></p>
                </div>
                <p style="color: #666;">
                  Please login with these credentials and change your password in Settings after login.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Login Now
                  </a>
                </div>
              </div>
            </div>
          `
        })
        console.log('Email sent successfully:', info.messageId)
        emailSent = true
      } catch (emailErr) {
        emailError = emailErr.message
        console.error('Email send error:', emailErr.message)
      }
    } else {
      console.log('Email not sent - missing config or user email')
    }
    
    // Always log for development
    console.log('═══════════════════════════════════════')
    console.log('🔐 NEW PASSWORD GENERATED')  
    console.log('═══════════════════════════════════════')
    console.log(`Username: ${user.username}`)
    console.log(`Email: ${userEmail || 'N/A'}`)
    console.log(`New Password: ${newPassword}`)
    console.log(`Email Sent: ${emailSent ? 'Yes ✅' : 'No ❌'}`)
    console.log('═══════════════════════════════════════')

    if (emailSent) {
      res.json({ message: 'New password has been sent to your email! Check your inbox.' })
    } else {
      // If email not configured, show password in response (for testing)
      res.json({ 
        message: 'If username exists, new password has been sent to your email',
        username: user.username,
        newPassword: newPassword,
        debug: true
      })
    }
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' })
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }

    user.password = password
    user.resetPasswordToken = null
    user.resetPasswordExpire = null
    await user.save()

    res.json({ message: 'Password reset successful! You can now login with new password.' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    res.json({ id: user._id, username: user.username, name: user.name, email: user.email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/change-password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' })
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' })
    }

    const user = await User.findById(req.user._id)
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully!' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/auth/update-profile - Update username, email, and optionally password
router.post('/update-profile', auth, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id)
    
    // Check if username is being changed and if it's already taken
    if (username && username.trim().toLowerCase() !== user.username) {
      const existing = await User.findOne({ username: username.trim().toLowerCase() })
      if (existing) {
        return res.status(409).json({ error: 'Username already taken' })
      }
      user.username = username.trim().toLowerCase()
    }
    
    // Update email if provided
    if (email !== undefined) {
      user.email = email?.trim() || ''
    }
    
    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' })
      }
      if (!(await user.matchPassword(currentPassword))) {
        return res.status(401).json({ error: 'Current password is incorrect' })
      }
      if (newPassword.length < 4) {
        return res.status(400).json({ error: 'New password must be at least 4 characters' })
      }
      user.password = newPassword
    }
    
    await user.save()
    res.json({ 
      message: 'Profile updated successfully!',
      user: { id: user._id, username: user.username, name: user.name, email: user.email }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router

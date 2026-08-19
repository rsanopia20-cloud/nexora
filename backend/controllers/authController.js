import User from '../models/User.js';
import Link, { LINK_SORT } from '../models/Link.js';
import { clearAuthCookie, setAuthCookie, signToken } from '../utils/token.js';
import { generateShortTrackingUrl } from '../utils/shortCode.js';
import { sendWelcomeEmail } from '../utils/sendWelcomeEmail.js';

function authPayload(user, token) {
  return {
    success: true,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      createdAt: user.createdAt,
    },
  };
}

async function buildWhatsAppLink(user) {
  // Always load from admin Link collection (active only) — never a hardcoded list.
  const activeLinks = await Link.find({ active: true }).sort(LINK_SORT);

  if (!activeLinks.length) {
    return null;
  }

  const firstName = String(user.fullName || '').trim().split(/\s+/)[0];
  const intro = firstName ? `Hi ${firstName},` : 'Hi,';

  const blocks = await Promise.all(
    activeLinks.map(async (link) => {
      // Short URL: /l/{code} — maps back to this admin link + user for tracking
      const trackingUrl = await generateShortTrackingUrl(link._id, user._id);
      return `${link.name}\n${trackingUrl}`;
    })
  );

  const message = [intro, ...blocks].join('\n\n');
  const number = process.env.BUSINESS_WHATSAPP_NUMBER;

  if (!number) {
    throw new Error('BUSINESS_WHATSAPP_NUMBER is not set');
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export async function signup(req, res) {
  try {
    const { fullName, mobile, email, password } = req.body;

    const [emailTaken, mobileTaken] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }).select('_id'),
      User.findOne({ mobile }).select('_id'),
    ]);

    const conflicts = [];
    if (emailTaken) {
      conflicts.push({ field: 'email', message: 'This email is already registered' });
    }
    if (mobileTaken) {
      conflicts.push({
        field: 'mobile',
        message: 'This mobile number is already registered',
      });
    }

    if (conflicts.length) {
      const both = conflicts.length === 2;
      return res.status(409).json({
        success: false,
        message: both
          ? 'An account with this email and mobile number already exists'
          : conflicts[0].field === 'email'
            ? 'An account with this email already exists'
            : 'An account with this mobile number already exists',
        errors: conflicts,
      });
    }

    const user = await User.create({
      fullName,
      mobile,
      email,
      password,
    });

    const token = signToken(user);
    setAuthCookie(res, token);

    // Tracking/WhatsApp link generation must never fail signup —
    // account creation + JWT already succeeded above.
    let waLink = null;
    try {
      waLink = await buildWhatsAppLink(user);
    } catch (error) {
      console.error('Signup tracking/WhatsApp link generation failed:', error);
      waLink = null;
    }

    // Fire-and-forget welcome email with T&C PDF — never block signup response.
    sendWelcomeEmail(user.email, user.fullName).catch((err) =>
      console.error('Email send failed:', err)
    );

    return res.status(201).json({
      ...authPayload(user, token),
      waLink,
      message: 'Account created successfully',
    });
  } catch (error) {
    if (error?.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'email';
      const label = field === 'mobile' ? 'mobile number' : field;
      return res.status(409).json({
        success: false,
        message: `An account with this ${label} already exists`,
        errors: [
          {
            field,
            message: `This ${label} is already registered`,
          },
        ],
      });
    }

    console.error('Signup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to create account. Please try again.',
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const matched = await user.comparePassword(password);

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    return res.json({
      ...authPayload(user, token),
      message: 'Logged in successfully',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unable to log in. Please try again.',
    });
  }
}

export async function me(req, res) {
  return res.json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      mobile: req.user.mobile,
      createdAt: req.user.createdAt,
    },
  });
}

export async function logout(_req, res) {
  clearAuthCookie(res);
  return res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

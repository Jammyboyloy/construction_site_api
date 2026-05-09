const transporter = require("../config/mailer");

const sendAccountEmail = async (to, password, role) => {
  await transporter.sendMail({
    from: "Construction System <noreply@system.com>",
    to,
    subject: "Your account is ready!",
    html: `
    <div style="background:#f0ede8; padding:40px 20px; font-family:Arial,sans-serif;">
      <div style="max-width:600px; margin:auto;">
        <div style="background:#ffffff; border:1px solid #e2ddd7; overflow:hidden;">

          <div style="height:5px; background:#f97316;"></div>

          <div style="padding:36px 40px 28px; border-bottom:1px solid #f0ece6;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
              <div style="color:#f97316; font-size:22px; font-weight:bold;">Construction System</div>
            </div>
            <div style="font-size:20px; color:#1a1a1a; font-weight:bold;">Welcome! Your account is ready</div>
          </div>

          <div style="padding:32px 40px;">
            <p style="color:#444; font-size:15px; line-height:1.8; margin:0 0 8px;">Hi there,</p>
            <p style="color:#444; font-size:15px; line-height:1.8; margin:0 0 28px;">
              We've set up your account. Here are your login details — keep them safe!
            </p>

            <div style="background:#fafaf9; border:1px solid #e8e2da; border-left:4px solid #f97316; padding:24px 28px; margin-bottom:24px;">
              <p style="font-size:12px; color:#f97316; font-weight:bold; letter-spacing:1px; margin:0 0 16px; text-transform:uppercase;">Your Login Details</p>
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #ede8e1; color:#888; font-size:14px;">Email</td>
                  <td style="padding:10px 0; border-bottom:1px solid #ede8e1; text-align:right; color:#1a1a1a; font-size:14px;">${to}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; border-bottom:1px solid #ede8e1; color:#888; font-size:14px;">Password</td>
                  <td style="padding:10px 0; border-bottom:1px solid #ede8e1; text-align:right; color:#444; font-size:15px; font-weight:bold;">${password}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0; color:#888; font-size:14px;">Role</td>
                  <td style="padding:10px 0; text-align:right;">
                    <span style="color:#444; font-size:12px; font-weight:bold; padding:4px 12px; border-radius:4px;">${role}</span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="background:#fff8f0; border:1px solid #fde2c0; border-radius:6px; padding:14px 18px; margin-bottom:32px;">
              <p style="color:#c2610a; font-size:13px; margin:0; line-height:1.7;">
                Please change your password after you log in for the first time. This keeps your account safe.
              </p>
            </div>

            <div style="text-align:center; margin-bottom:16px;">
              <a href="http://localhost:3000/login"
                 style="display:inline-block; background:#f97316; color:#ffffff; font-size:15px; font-weight:bold; text-decoration:none; padding:14px 40px; border-radius:6px;">
                Log In Now
              </a>
            </div>

            <div style="height:1px; background:#ede8e1; margin:28px 0;"></div>

            <p style="text-align:center; color:#aaa; font-size:12px; line-height:1.8; margin:0;">
              Button not working? Open this link in your browser:<br/>
              <a href="http://localhost:3000/login" style="color:#f97316; text-decoration:none;">http://localhost:3000/login</a>
            </p>
          </div>

          <div style="background:#fafaf9; padding:16px 40px; border-top:1px solid #ede8e1; text-align:center;">
            <p style="color:#ccc; font-size:12px; margin:0;">This email was sent by Construction System · noreply@system.com</p>
          </div>

          <div style="height:3px; background:#f97316;"></div>
        </div>
      </div>
    </div>
    `,
  });
};

const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: "Construction System <noreply@system.com>",
    to,
    subject: "Your OTP Code",
    html: `
    <div style="background:#f0ede8; padding:40px 20px; font-family:Arial,sans-serif;">
      <div style="max-width:600px; margin:auto;">
        <div style="background:#ffffff; border:1px solid #e2ddd7; overflow:hidden;">

          <div style="height:5px; background:#f97316;"></div>

          <div style="padding:36px 40px 28px; border-bottom:1px solid #f0ece6;">
            <div style="color:#f97316; font-size:22px; font-weight:bold; margin-bottom:20px;">
              Construction System
            </div>
            <div style="font-size:20px; color:#1a1a1a; font-weight:bold;">
              Password Reset OTP
            </div>
          </div>

          <div style="padding:32px 40px;">
            <p style="color:#444; font-size:15px; line-height:1.8;">
              Hi there,
            </p>

            <p style="color:#444; font-size:15px; line-height:1.8; margin-bottom:24px;">
              Use the OTP code below to reset your password:
            </p>

            <div style="text-align:center; margin:30px 0;">
              <span style="
                display:inline-block;
                font-size:28px;
                font-weight:bold;
                letter-spacing:6px;
                color:#f97316;
                background:#fff8f0;
                padding:14px 24px;
                border:1px solid #fde2c0;
                border-radius:8px;
              ">
                ${otp}
              </span>
            </div>

            <div style="background:#fff8f0; border:1px solid #fde2c0; border-radius:6px; padding:14px 18px; margin-bottom:24px;">
              <p style="color:#c2610a; font-size:13px; margin:0;">
                This code will expire in 10 minutes. Do not share it with anyone.
              </p>
            </div>

            <p style="color:#999; font-size:13px;">
              If you didn’t request this, you can ignore this email.
            </p>
          </div>

          <div style="background:#fafaf9; padding:16px 40px; border-top:1px solid #ede8e1; text-align:center;">
            <p style="color:#ccc; font-size:12px; margin:0;">
              This email was sent by Construction System · noreply@system.com
            </p>
          </div>

          <div style="height:3px; background:#f97316;"></div>
        </div>
      </div>
    </div>
    `,
  });
};

module.exports = { sendAccountEmail, sendOtpEmail };
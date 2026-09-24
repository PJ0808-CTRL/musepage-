const fs = require('fs');
const file = 'D:/musepage/creator-site/app/api/send-welcome-email/route.ts';
let content = fs.readFileSync(file, 'utf8');
const startString = '      html: `\n<!doctype html>';
const endString = '</html>\n      `,';
const startIndex = content.indexOf(startString);
const endIndex = content.indexOf(endString) + endString.length;
const before = content.slice(0, startIndex);
const after = content.slice(endIndex);

const newHtml = `      html: \`
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MusePage</title>
</head>
<body style="margin:0;padding:0;background:#F0EBE2;font-family:Arial,Helvetica,sans-serif;color:#241f1a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#F0EBE2;padding:40px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
<tr><td style="padding:0 0 24px 0;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td style="width:38px;height:38px;border-radius:10px;background:#EDE0CC;color:#9B7442;text-align:center;vertical-align:middle;font-family:Georgia,serif;font-size:18px;font-weight:bold;">M</td>
    <td style="padding-left:10px;color:#211d18;font-size:17px;font-weight:700;">MusePage</td>
  </tr></table>
</td></tr>
<tr><td>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAF7F2;border:1px solid #DDD3C5;border-radius:24px;overflow:hidden;">
  <tr><td style="height:6px;background:#9B7442;"></td></tr>
  <tr><td style="padding:44px 44px 0 44px;">
    <div style="display:inline-block;padding:6px 14px;border:1px solid #DBC8AA;border-radius:999px;background:#F1E6D5;color:#8B6536;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;">Welcome to MusePage</div>
    <h1 style="margin:20px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:36px;line-height:1.12;font-weight:400;letter-spacing:-0.03em;color:#1E1A16;">Your corner of the internet<br>has begun, \${safeDisplayName}.</h1>
    <p style="margin:18px 0 0;font-size:15px;line-height:1.75;color:#7A7168;">Your <strong style="color:#443c34;">\${safeTemplate}</strong> page is live and ready to be made unmistakably yours.</p>
  </td></tr>
  \${
    pageUrl
      ? \`<tr><td style="padding:28px 44px 0 44px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5EEE4;border:1px solid #DED0BC;border-radius:16px;"><tr><td style="padding:20px 22px;">
      <div style="color:#A09484;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Your MusePage</div>
      <div style="margin-top:8px;font-family:Georgia,serif;font-size:20px;color:#3C352D;">@\${safeUsername}</div>
      <div style="margin-top:6px;color:#9A8F82;font-size:12px;word-break:break-all;">\${safePageUrl}</div>
    </td></tr></table>
  </td></tr>\`
      : ''
  }
  <tr><td style="padding:32px 44px 0 44px;">
    <div style="color:#9B7442;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:20px;">What's on your MusePage</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#EDE0CC;text-align:center;line-height:32px;font-size:16px;">🎨</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Luxury Presets</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Atelier, Noir, Sage, Oxblood and Midnight — five refined visual directions ready in one click.</div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E4EADF;text-align:center;line-height:32px;font-size:16px;">📊</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">Live Analytics</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Understand your visitors, clicks, CTR and traffic sources — all in real time from your dashboard.</div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:16px;"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E8DDD9;text-align:center;line-height:32px;font-size:16px;">🔍</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">SEO Controls</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Own how your page appears on Google and social media with full control over titles and descriptions.</div></td>
    </tr></table>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="40" valign="top"><div style="width:32px;height:32px;border-radius:9px;background:#E0E8F0;text-align:center;line-height:32px;font-size:16px;">✏️</div></td>
      <td valign="top" style="padding-left:14px;"><div style="font-size:14px;font-weight:700;color:#2E2920;margin-bottom:4px;">No-Code Editing</div><div style="font-size:13px;color:#8A8074;line-height:1.6;">Add links, images, videos, Spotify embeds and more — all by dragging and typing, no code needed.</div></td>
    </tr></table>
  </td></tr>
  \${
    dashboardUrl
      ? \`<tr><td style="padding:32px 44px 0 44px;"><a href="\${safeDashboardUrl}" style="display:inline-block;padding:15px 28px;border-radius:12px;background:#9B7442;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Open your dashboard &rarr;</a></td></tr>\`
      : ''
  }
  <tr><td style="padding:32px 44px 40px 44px;">
    <div style="border-top:1px solid #E3DBD0;padding-top:24px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#7A7168;font-style:italic;">Build it. Shape it. Make it yours.</p>
      <p style="margin:10px 0 0;font-size:12px;color:#A09484;">— The MusePage team</p>
    </div>
  </td></tr>
</table>
</td></tr>
<tr><td style="padding:18px 0 0;text-align:center;color:#B0A89A;font-size:11px;line-height:1.6;">You received this because this email was used to create a MusePage account.</td></tr>
</table>
</td></tr></table>
</body>
</html>
      \`,`;
fs.writeFileSync(file, before + newHtml + after);
console.log('Successfully replaced HTML template');

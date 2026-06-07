module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let intake;
  try {
    intake = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!intake || typeof intake !== 'object') throw new Error('empty');
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  // Escape all user-supplied values before HTML interpolation
  const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  try {
    const coachName = esc(((intake.coach?.name_and_brand || 'Unknown Coach').split('·')[0]).trim());
    const slug = esc(intake.meta?.slug || 'client');
    const niche = esc(intake.coach?.niche || '—');
    const vision = esc(intake.coach?.downstream_vision || '—');
    const archive = esc(intake.archive?.inventory || '—');
    const consent = esc(intake.legal?.client_consent || '—');
    const gdpr = esc(intake.legal?.gdpr_exposure || '—');
    const sla = esc(intake.commitments?.email_sla || '—');
    const fileIssues = esc(intake.commitments?.known_file_issues || 'None noted');
    const submitted = new Date().toUTCString();

    const html = `
<h2 style="font-family:sans-serif;margin:0 0 4px">New Brain intake</h2>
<p style="font-family:sans-serif;font-size:18px;font-weight:700;margin:0 0 24px;color:#4A9B8E">${coachName}</p>

<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
  <tr><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;color:#666;width:160px;white-space:nowrap">Niche</td><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0">${niche}</td></tr>
  <tr><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;color:#666">Downstream vision</td><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0">${vision}</td></tr>
  <tr><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;color:#666">Archive</td><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;white-space:pre-wrap">${archive}</td></tr>
  <tr><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;color:#666">Consent status</td><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0">${consent}</td></tr>
  <tr><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;color:#666">GDPR exposure</td><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0">${gdpr}</td></tr>
  <tr><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0;color:#666">Email SLA</td><td style="padding:10px 16px;border-bottom:1px solid #E0E0E0">${sla}</td></tr>
  <tr><td style="padding:10px 16px;color:#666">File access issues</td><td style="padding:10px 16px">${fileIssues}</td></tr>
</table>

<p style="font-family:monospace;font-size:13px;background:#F5F5F5;padding:12px 16px;margin:24px 0 8px">
  python3 scripts/process-intake.py ${slug}-intake.json
</p>

<p style="font-family:sans-serif;font-size:12px;color:#999;margin:24px 0 0">Submitted ${submitted}</p>
    `.trim();

    const jsonContent = Buffer.from(JSON.stringify(intake, null, 2)).toString('base64');

    const payload = {
      personalizations: [{ to: [{ email: 'justin@naultsystems.com' }] }],
      from: { email: 'justin@naultsystems.com', name: 'Brain Intake' },
      subject: `New Brain intake — ${coachName}`,
      content: [{ type: 'text/html', value: html }],
      attachments: [
        {
          content: jsonContent,
          filename: `${slug}-intake.json`,
          type: 'application/json',
          disposition: 'attachment',
        },
      ],
    };

    if (intake.coach?.email) {
      payload.reply_to = { email: intake.coach.email };
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('SendGrid error:', err);
      return res.status(500).json({ error: 'Email delivery failed', detail: err });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Submit handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

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

    const d = intake;
    const se = d.seven_elements || {};
    const bf = d.build_focus || {};
    const cm = d.commitments || {};
    const rawSlug = d.meta?.slug || 'client';
    const now = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

    const markdown = `# The Brain — Client Intake
## ${d.coach?.name_and_brand || 'Client'} · ${now}

---

## Section 1 — Who You Are

**Q1 Name & Brand:** ${d.coach?.name_and_brand || ''}
**Q2 Niche:** ${d.coach?.niche || ''}
**Q3 Experience:** ${d.coach?.experience || ''}
**Q4 Delivery format:** ${d.coach?.delivery_format || ''}
**Q5 Tech stack:**
${d.coach?.tech_stack || ''}

**Q6 Downstream vision:**
${d.coach?.downstream_vision || ''}

---

## Section 2 — Archive

**Q7 Inventory:**
${d.archive?.inventory || ''}

**Q8 Organization state:** ${d.archive?.organization || ''}
**Q9 Formats:** Video: ${d.archive?.formats?.video ? '✓' : '–'} | Audio: ${d.archive?.formats?.audio ? '✓' : '–'} | Transcripts (doc): ${d.archive?.formats?.transcripts_doc ? '✓' : '–'} | Transcripts (platform): ${d.archive?.formats?.transcripts_platform ? '✓' : '–'} | Service: ${d.archive?.formats?.transcript_service || '—'}
**Q10 Avg session length:** ${d.archive?.avg_session_length || ''}
**Q11 Authorship:** ${d.archive?.authorship || ''}
**Q12 Old-era content:** ${d.archive?.old_era_content || 'None noted'}
**Q13 Crown jewel:** ${d.archive?.crown_jewel || ''}
**Q14 Exclusions:** ${d.archive?.exclusions || 'None noted'}

---

## Section 3 — Legal & Consent

**Q15 Client consent:** ${d.legal?.client_consent || ''}
**Q16 International clients (GDPR):** ${d.legal?.gdpr_exposure || ''}
**Q17 Co-created content:** ${d.legal?.co_created_content || ''}
**Q18 NDAs & third-party IP:** ${d.legal?.ndas_third_party_ip || ''}

---

## Section 4 — The Seven Elements

### 01 — DISTINCTIONS
**Q19 Distinction pairs:**
${se.distinctions?.pairs || ''}

**Q20 Non-obvious distinction:**
${se.distinctions?.non_obvious || ''}

### 02 — EVOLUTION
**Q21 Stopped teaching:**
${se.evolution?.stopped_teaching || ''}

**Q22 Biggest reversal:**
${se.evolution?.biggest_reversal || ''}

**Q23 Before/after era:**
${se.evolution?.before_after_era || ''}

### 03 — DOMAINS
**Q24 All domains:** ${se.domains?.all_domains || ''}
**Q25 Domain percentages:** ${se.domains?.percentages || ''}
**Q26 Cross-domain example:**
${se.domains?.cross_domain_example || ''}

**Q27 Missed connection:**
${se.domains?.missed_connection || ''}

**Q28 Private domains:** ${se.domains?.private_domains || 'None'}

### 04 — VOICE
**Q29 Signature phrases:**
${se.voice?.phrases || ''}

**Q30 Client language before you:**
${se.voice?.client_language_before || ''}

**Q31 Avoided terms:** ${se.voice?.avoided_terms || ''}
**Q32 Signature analogy:**
${se.voice?.signature_analogy || ''}

**Q33 Rhetorical move:** ${se.voice?.rhetorical_move || ''}
**Q34 Proper nouns:** ${se.voice?.proper_nouns || ''}

### 05 — CONFIDENCE
**Q35 Settled claims:**
${se.confidence?.settled || ''}

**Q36 Still refining:**
${se.confidence?.refining || ''}

**Q37 Original synthesis:**
${se.confidence?.original_synthesis || ''}

**Q38 Beginner vs advanced:**
${se.confidence?.beginner_vs_advanced || ''}

### 06 — CONFLICT
**Q39 Argues against:**
${se.conflict?.argues_against || ''}

**Q40 Most explicit divergence:**
${se.conflict?.diverges_most || ''}

**Q41 Concerning products/practices:**
${se.conflict?.concerning_products || ''}

**Q42 Claims needing careful framing:**
${se.conflict?.careful_framing || ''}

### 07 — CORRECTIONS
**Q43 Public reversals:**
${se.corrections?.public_reversals || ''}

**Q44 Framing shifts:**
${se.corrections?.framing_shifts || ''}

**Q45 Concerning archive content:**
${se.corrections?.concerning_archive || ''}

---

## Section 5 — Build Focus & Guardrails

**Q46 Day-one capability:**
${bf.day_one_capability || ''}

**Q47 Three differentiators:**
${bf.three_differentiators || ''}

**Q48 Must never say:**
${bf.never_say || ''}

**Q49 Common misunderstanding:**
${bf.common_misunderstanding || ''}

**Q50 Anchor transformation story:**
${bf.anchor_story || ''}

---

## Section 6 — Commitments

**Q51 Email SLA:** ${cm.email_sla || ''} ${cm.sla_other ? '('+cm.sla_other+')' : ''}
**Q52 Review pass lead time:** ${cm.review_pass_lead_time || ''}
**Q53 Blackout dates:** ${cm.blackout_dates || 'None'}
**Q54 Known file access issues:**
${cm.known_file_issues || 'None noted'}

**Q55 Anything else:**
${cm.anything_else || 'Nothing additional.'}
`;

    const preflightPrompt = `# PREFLIGHT — Brain Build for ${d.coach?.name_and_brand?.split('·')[0]?.trim() || 'Client'}
# Run this in Claude Code in the client-brain-build project directory

You are running a preflight analysis for a new Brain build. Read the complete intake data below, then produce a structured PREFLIGHT.md document.

## INTAKE DATA

Coach: ${d.coach?.name_and_brand || ''}
Niche: ${d.coach?.niche || ''}
Experience: ${d.coach?.experience || ''}
Delivery: ${d.coach?.delivery_format || ''}
Tech Stack: ${d.coach?.tech_stack || ''}
Downstream Vision: ${d.coach?.downstream_vision || ''}

### Archive
${d.archive?.inventory || ''}
Organization: ${d.archive?.organization || ''}
Session length: ${d.archive?.avg_session_length || ''}
Authorship: ${d.archive?.authorship || ''}
Old-era content: ${d.archive?.old_era_content || 'None noted'}
Exclusions: ${d.archive?.exclusions || 'None'}

### Legal
Consent status: ${d.legal?.client_consent || 'unknown'}
GDPR exposure: ${d.legal?.gdpr_exposure || 'unknown'}
Co-created content: ${d.legal?.co_created_content || 'None noted'}
IP/NDAs: ${d.legal?.ndas_third_party_ip || 'None noted'}

### The Seven Elements
DISTINCTIONS: ${se.distinctions?.pairs || ''}
EVOLUTION (reversals): ${se.corrections?.public_reversals || ''} / Era shift: ${se.evolution?.before_after_era || ''}
DOMAINS: ${se.domains?.all_domains || ''}
VOICE (phrases): ${se.voice?.phrases || ''}
VOICE (proper nouns): ${se.voice?.proper_nouns || ''}
VOICE (avoid): ${se.voice?.avoided_terms || ''}
CONFIDENCE (settled): ${se.confidence?.settled || ''}
CONFLICT (argues against): ${se.conflict?.argues_against || ''}
CORRECTIONS: ${se.corrections?.public_reversals || ''}

### Build Focus
Day-one capability: ${bf.day_one_capability || ''}
Never say: ${bf.never_say || ''}
Common misunderstanding: ${bf.common_misunderstanding || ''}

### Commitments
Email SLA: ${cm.email_sla || ''}
Blackout dates: ${cm.blackout_dates || 'None'}
Known file issues: ${cm.known_file_issues || 'None'}

---

## PREFLIGHT ANALYSIS REQUIRED

Produce a PREFLIGHT.md with these exact sections:

### 1. Archive Assessment
- Estimated total processing time based on archive description
- File access risks (platform lock-in, missing files, naming issues)
- Transcription scope (raw video vs existing transcripts)
- Old-era content handling recommendation

### 2. Legal & Consent Flags
Rate each flag: CRITICAL (blocks build) / SERIOUS (requires scoping) / MONITOR (note and proceed)
- Client consent status: ${d.legal?.client_consent || 'unknown'}
- GDPR exposure: ${d.legal?.gdpr_exposure || 'unknown'}
- Co-created content: ${d.legal?.co_created_content || 'none reported'}
- Third-party IP: ${d.legal?.ndas_third_party_ip || 'none reported'}
For each CRITICAL or SERIOUS flag: state the specific action required before build starts.

### 3. Vault Architecture Recommendation
Based on their domains (${se.domains?.all_domains || 'not specified'}), recommend:
- Exact wiki/ subfolder list (use Justin Brain naming conventions)
- Domain index files needed
- Confidence taxonomy assignment (practical-by-default unless other)
- View evolution tracking
- Canonical example pairs to add to CLAUDE.md (from their distinction pairs)

### 4. Build Priority & Processing Order
Which source files should be processed first? Rank top 3 with reasoning.
Crown jewel: ${d.archive?.crown_jewel || 'not specified'}
Domain percentages: ${se.domains?.percentages || 'not specified'}

### 5. Timeline Estimate
Based on archive volume and organization state (${d.archive?.organization || 'unknown'}):
- Best case / Likely / Worst case (if access issues)
- Risk factors that could extend timeline

### 6. Open Questions
List every question that MUST be answered before build starts. Format:
- [Question] — needed because [reason] — severity: CRITICAL/SERIOUS

### 7. Risk Register
| Risk | Likelihood | Impact | Mitigation |
Build the table.

### 8. CLAUDE.md Scaffold
Write the complete CLAUDE.md for this client's vault. Output inside a code block.

### 9. INGESTION-PROMPT.md Scaffold
Write a complete INGESTION-PROMPT.md customized for this coach. Output inside a code block.

Client slug for folder: ${rawSlug}
Target folder: clients/${rawSlug}/
`;

    const enc = (s) => Buffer.from(s).toString('base64');

    const jsonContent = enc(JSON.stringify(intake, null, 2));
    const mdContent = enc(markdown);
    const preflightContent = enc(preflightPrompt);

    const payload = {
      personalizations: [{ to: [{ email: 'justin@naultsystems.com' }] }],
      from: { email: 'justin@naultsystems.com', name: 'Brain Intake' },
      subject: `New Brain intake — ${coachName}`,
      content: [{ type: 'text/html', value: html }],
      attachments: [
        { content: jsonContent,      filename: `${rawSlug}-intake.json`,           type: 'application/json', disposition: 'attachment' },
        { content: mdContent,        filename: `${rawSlug}-intake.md`,             type: 'text/markdown',    disposition: 'attachment' },
        { content: preflightContent, filename: `${rawSlug}-preflight-prompt.txt`,  type: 'text/plain',       disposition: 'attachment' },
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

import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    const caseData = await db.case.findUnique({
      where: { id: caseId },
      include: {
        requirements: { orderBy: { sortOrder: 'asc' } },
        counselingSessions: { orderBy: { date: 'desc' } },
        drugTests: { orderBy: { date: 'desc' } },
        naSteps: { orderBy: { stepNumber: 'asc' } },
        naMeetings: { orderBy: { date: 'desc' } },
        supervisedVisits: { orderBy: { date: 'desc' } },
        courtDates: { orderBy: { date: 'desc' } },
        parentingClasses: { orderBy: { date: 'desc' } },
        milestones: { orderBy: { targetDate: 'asc' } },
        dailyCheckIns: { orderBy: { date: 'desc' } },
      },
    })

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    const c = {
      caseNumber: caseData.caseNumber,
      court: caseData.courtName,
      caseworker: caseData.caseworkerName,
      caseworkerPhone: caseData.caseworkerPhone,
      judge: caseData.judgeName,
      attorney: caseData.attorneyName,
      attorneyPhone: caseData.attorneyPhone,
      removalDate: caseData.removalDate,
      targetReunificationDate: caseData.targetReunificationDate,
      status: caseData.caseStatus,
    }

    const fd = (d: Date | null) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'

    const summary = {
      totalRequirements: caseData.requirements.length,
      completedRequirements: caseData.requirements.filter(r => r.isCompleted).length,
      totalDrugTests: caseData.drugTests.filter(t => t.result).length,
      negativeDrugTests: caseData.drugTests.filter(t => t.result === 'negative').length,
      completedNASteps: caseData.naSteps.filter(s => s.isCompleted).length,
      totalCounselingSessions: caseData.counselingSessions.filter(s => s.isCompleted).length,
      completedVisits: caseData.supervisedVisits.filter(v => v.isCompleted).length,
      completedMilestones: caseData.milestones.filter(m => m.isCompleted).length,
    }

    // Build sections
    let sections = ''

    // Requirements
    if (caseData.requirements.length > 0) {
      sections += `<h2>Case Plan Requirements</h2><table><tr><th>Category</th><th>Requirement</th><th>Frequency</th><th>Status</th><th>Completed</th></tr>`
      caseData.requirements.forEach(r => {
        sections += `<tr><td>${r.category}</td><td>${r.title}</td><td>${r.frequency || 'N/A'}</td><td>${r.isCompleted ? '<span class="completed">Completed</span>' : '<span class="pending">In Progress</span>'}</td><td>${fd(r.completedAt)}</td></tr>`
      })
      sections += `</table>`
    }

    // Counseling
    if (caseData.counselingSessions.length > 0) {
      sections += `<h2>Counseling Sessions</h2><table><tr><th>Date</th><th>Counselor</th><th>Type</th><th>Duration</th><th>Status</th></tr>`
      caseData.counselingSessions.forEach(s => {
        sections += `<tr><td>${fd(s.date)}</td><td>${s.counselorName || 'N/A'}</td><td>${s.sessionType || 'N/A'}</td><td>${s.duration ? s.duration + ' min' : 'N/A'}</td><td>${s.isCompleted ? '<span class="completed">Completed</span>' : '<span class="pending">Scheduled</span>'}</td></tr>`
      })
      sections += `</table>`
    }

    // Drug Tests
    if (caseData.drugTests.length > 0) {
      sections += `<h2>Drug Tests</h2><table><tr><th>Date</th><th>Type</th><th>Random</th><th>Result</th><th>Facility</th></tr>`
      caseData.drugTests.forEach(t => {
        const resultClass = t.result === 'negative' ? 'negative' : t.result === 'positive' ? 'positive' : ''
        const resultText = t.result === 'negative' ? 'Negative' : t.result === 'positive' ? 'Positive' : t.result || 'Pending'
        sections += `<tr><td>${fd(t.date)}</td><td>${t.testType || 'N/A'}</td><td>${t.isRandom ? 'Yes' : 'No'}</td><td>${resultClass ? `<span class="${resultClass}">${resultText}</span>` : resultText}</td><td>${t.testingFacility || 'N/A'}</td></tr>`
      })
      sections += `</table>`
    }

    // NA Meetings
    if (caseData.naMeetings.length > 0) {
      sections += `<h2>NA/AA Meetings</h2><table><tr><th>Date</th><th>Meeting</th><th>Location</th><th>Topic</th><th>Verified</th></tr>`
      caseData.naMeetings.forEach(m => {
        sections += `<tr><td>${fd(m.date)}</td><td>${m.meetingName || 'N/A'}</td><td>${m.location || 'N/A'}</td><td>${m.topic || 'N/A'}</td><td>${m.isVerified ? '<span class="completed">Verified</span>' : 'Unverified'}</td></tr>`
      })
      sections += `</table>`
    }

    // Supervised Visits
    if (caseData.supervisedVisits.length > 0) {
      sections += `<h2>Supervised Visits</h2><table><tr><th>Date</th><th>Type</th><th>Location</th><th>Supervisor</th><th>Duration</th><th>Status</th></tr>`
      caseData.supervisedVisits.forEach(v => {
        sections += `<tr><td>${fd(v.date)}</td><td>${v.visitType || 'N/A'}</td><td>${v.location || 'N/A'}</td><td>${v.supervisorName || 'N/A'}</td><td>${v.duration ? v.duration + ' min' : 'N/A'}</td><td>${v.isCompleted ? '<span class="completed">Completed</span>' : '<span class="pending">Scheduled</span>'}</td></tr>`
      })
      sections += `</table>`
    }

    // Parenting Classes
    if (caseData.parentingClasses.length > 0) {
      sections += `<h2>Parenting Classes</h2><table><tr><th>Date</th><th>Class</th><th>Provider</th><th>Topic</th><th>Status</th><th>Certificate</th></tr>`
      caseData.parentingClasses.forEach(p => {
        sections += `<tr><td>${fd(p.date)}</td><td>${p.className || 'N/A'}</td><td>${p.provider || 'N/A'}</td><td>${p.topic || 'N/A'}</td><td>${p.isCompleted ? '<span class="completed">Completed</span>' : '<span class="pending">Upcoming</span>'}</td><td>${p.hasCertificate ? 'Yes' : 'No'}</td></tr>`
      })
      sections += `</table>`
    }

    // Court Dates
    if (caseData.courtDates.length > 0) {
      sections += `<h2>Court Dates</h2><table><tr><th>Date</th><th>Hearing Type</th><th>Outcome</th><th>Next Steps</th></tr>`
      caseData.courtDates.forEach(cd => {
        sections += `<tr><td>${fd(cd.date)}</td><td>${cd.hearingType || 'N/A'}</td><td>${cd.outcome || 'Pending'}</td><td>${cd.nextSteps || 'N/A'}</td></tr>`
      })
      sections += `</table>`
    }

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reunify Progress Report</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1a1a1a;line-height:1.5}h1{font-size:24px;margin-bottom:4px;color:#059669}h2{font-size:18px;margin:20px 0 10px;border-bottom:2px solid #059669;color:#047857}.header{margin-bottom:20px;border-bottom:1px solid #e5e7eb;padding-bottom:16px}.header p{font-size:12px;color:#6b7280}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px}.info-item{font-size:12px}.info-item strong{color:#374151}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:16px 0}.stat-card{background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:12px;text-align:center}.stat-card .number{font-size:20px;font-weight:bold;color:#059669}.stat-card .label{font-size:11px;color:#065f46}table{width:100%;border-collapse:collapse;margin:8px 0 16px}th{background:#ecfdf5;color:#065f46;font-size:12px;text-align:left;padding:8px;border:1px solid #a7f3d0}td{font-size:11px;padding:6px 8px;border:1px solid #e5e7eb}.completed{color:#059669;font-weight:bold}.pending{color:#d97706}.negative{color:#059669;font-weight:bold}.positive{color:#dc2626}.footer{margin-top:32px;border-top:1px solid #e5e7eb;padding-top:16px;font-size:11px;color:#6b7280;text-align:center}@media print{body{padding:20px}}</style></head><body><div class="header"><h1>Reunify Progress Report</h1><p>CPS Reunification Case Compliance Documentation</p><p>Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p></div><h2>Case Information</h2><div class="info-grid"><div class="info-item"><strong>Case Number:</strong> ${c.caseNumber || 'N/A'}</div><div class="info-item"><strong>Court:</strong> ${c.court || 'N/A'}</div><div class="info-item"><strong>Caseworker:</strong> ${c.caseworker || 'N/A'}</div><div class="info-item"><strong>Caseworker Phone:</strong> ${c.caseworkerPhone || 'N/A'}</div><div class="info-item"><strong>Judge:</strong> ${c.judge || 'N/A'}</div><div class="info-item"><strong>Attorney:</strong> ${c.attorney || 'N/A'}</div><div class="info-item"><strong>Removal Date:</strong> ${fd(c.removalDate)}</div><div class="info-item"><strong>Target Reunification:</strong> ${fd(c.targetReunificationDate)}</div><div class="info-item"><strong>Case Status:</strong> ${c.status || 'Active'}</div></div><h2>Compliance Summary</h2><div class="stats-grid"><div class="stat-card"><div class="number">${summary.completedRequirements}/${summary.totalRequirements}</div><div class="label">Requirements Completed</div></div><div class="stat-card"><div class="number">${summary.negativeDrugTests}/${summary.totalDrugTests}</div><div class="label">Clean Drug Tests</div></div><div class="stat-card"><div class="number">${summary.completedNASteps}/12</div><div class="label">NA Steps Completed</div></div><div class="stat-card"><div class="number">${summary.completedMilestones}</div><div class="label">Milestones Achieved</div></div></div>${sections}<div class="footer"><p>This report was generated by Reunify — CPS Reunification Progress Tracker</p><p>Every step brings you closer to your kids</p></div></body></html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'X-Export-Type': 'pdf-report',
      },
    })
  } catch (error) {
    console.error('Error generating PDF report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// Cache the SDK instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

const SYSTEM_PROMPT = `You are an expert at reading and extracting information from CPS (Child Protective Services) reunification case plans. These are official court-ordered documents that specify what a parent must do to reunify with their children.

You will be given photo(s) of a case plan document. Extract ALL the information you can find and return it as structured JSON.

IMPORTANT: Return ONLY valid JSON, no markdown, no code fences, no extra text.

The JSON structure must be:
{
  "caseInfo": {
    "caseNumber": "string or null",
    "courtName": "string or null",
    "judgeName": "string or null",
    "caseworkerName": "string or null",
    "caseworkerPhone": "string or null",
    "attorneyName": "string or null",
    "attorneyPhone": "string or null",
    "removalDate": "YYYY-MM-DD or null",
    "targetReunificationDate": "YYYY-MM-DD or null"
  },
  "requirements": [
    {
      "category": "counseling|drug-testing|na-meetings|na-steps|supervised-visits|parenting-classes|housing|employment|other",
      "title": "string - short name of the requirement",
      "description": "string - full description of what is required",
      "frequency": "daily|weekly|biweekly|monthly|as-needed|one-time",
      "dueDate": "YYYY-MM-DD or null"
    }
  ],
  "counseling": {
    "sessionType": "individual|group|family|couples or null",
    "frequency": "string describing how often, e.g. weekly, twice monthly",
    "counselorName": "string or null",
    "duration": "number in minutes or null",
    "notes": "string or null"
  },
  "drugTesting": {
    "testType": "urine|hair|blood|saliva or null",
    "frequency": "string describing how often, e.g. weekly, random, twice weekly",
    "testingFacility": "string or null",
    "isRandom": true or false,
    "notes": "string or null"
  },
  "naMeetings": {
    "frequency": "string describing how often, e.g. 3 per week, weekly",
    "notes": "string or null"
  },
  "supervisedVisits": {
    "frequency": "string describing how often, e.g. weekly, biweekly",
    "location": "string or null",
    "supervisorName": "string or null",
    "duration": "number in minutes or null",
    "visitType": "supervised|semi-supervised|unsupervised or null",
    "notes": "string or null"
  },
  "parentingClasses": {
    "className": "string or null",
    "provider": "string or null",
    "frequency": "string describing how often",
    "notes": "string or null"
  },
  "courtDates": [
    {
      "date": "YYYY-MM-DD or null",
      "hearingType": "emergency|adjudication|disposition|review|permanency|termination|final or null",
      "notes": "string or null"
    }
  ],
  "milestones": [
    {
      "title": "string",
      "category": "legal|recovery|family|housing|employment|education|other",
      "targetDate": "YYYY-MM-DD or null",
      "description": "string or null"
    }
  ],
  "additionalNotes": "string - any other information found on the document that does not fit above"
}

EXTRACTION RULES:
- If you cannot determine a value, use null (not empty string)
- For dates, try to parse them into YYYY-MM-DD format. If you can only determine month or year, use the 1st of that month.
- For frequency, use the most specific description you can find (e.g. twice weekly not just regular)
- Look for key CPS terms: case plan, reunification, disposition, adjudication, review hearing, permanency hearing
- Common categories: mental health counseling, substance abuse treatment, drug testing, NA or AA meetings, parenting classes, supervised visitation, housing, employment, domestic violence classes, anger management
- If something mentions random drug testing, set isRandom to true
- Map hearing types: review hearing to review, permanency hearing to permanency, adjudication hearing to adjudication, disposition hearing to disposition, emergency to emergency, final to final
- NA or AA meetings are under na-meetings category. NA 12-step work is under na-steps category.
- Extract EVERYTHING you can find - even if you are not sure about the category, put it in requirements with other category and add a note`

// Route segment config for large payloads
export const maxDuration = 60

// Allow larger request bodies for image uploads (up to 5 compressed images at ~1.5MB each)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

// Increase body size limit for image uploads (up to 5 compressed images)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    // Try to parse the body - if it's too large, this will fail
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('[scan-case-plan] Failed to parse request body:', parseError)
      const errMsg = parseError instanceof Error ? parseError.message : 'Unknown parse error'
      if (errMsg.includes('too large') || errMsg.includes('exceeded') || errMsg.includes('limit') || errMsg.includes('size')) {
        return NextResponse.json(
          { error: 'Photos are too large. Please try with fewer or smaller photos. You can also take photos from further away for smaller file sizes.' },
          { status: 413 }
        )
      }
      return NextResponse.json(
        { error: 'Could not read the uploaded photos. Please try again.' },
        { status: 400 }
      )
    }

    const { images } = body as { images: string[] }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
        { status: 400 }
      )
    }

    if (images.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 pages allowed' },
        { status: 400 }
      )
    }

    // Log total payload size for debugging
    const totalSize = images.reduce((sum, img) => sum + img.length, 0)
    console.log(`[scan-case-plan] Processing ${images.length} images, total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)

    const zai = await getZAI()

    // Build the content array with all images
    const imageContents = images.map((img) => ({
      type: 'image_url' as const,
      image_url: { url: img },
    }))

    const pageText = images.length === 1
      ? 'I am uploading a photo of my CPS reunification case plan. Extract all the information.'
      : `I am uploading ${images.length} pages of my CPS reunification case plan. Page 1 is first, page ${images.length} is last. Analyze all pages together and extract all the information.`

    let response
    try {
      response = await zai.chat.completions.createVision({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: SYSTEM_PROMPT },
              ...imageContents,
              { type: 'text', text: pageText },
            ],
          },
        ],
        thinking: { type: 'disabled' },
      })
    } catch (vlmError) {
      console.error('[scan-case-plan] VLM API error:', vlmError)
      const errMsg = vlmError instanceof Error ? vlmError.message : 'Unknown VLM error'
      // Provide more user-friendly error messages based on common VLM errors
      let userMessage: string
      if (errMsg.includes('rate') || errMsg.includes('limit') || errMsg.includes('429')) {
        userMessage = 'The AI service is busy right now. Please wait a moment and try again.'
      } else if (errMsg.includes('timeout') || errMsg.includes('timed out')) {
        userMessage = 'The AI service took too long to respond. Please try again with fewer or smaller photos.'
      } else if (errMsg.includes('quota') || errMsg.includes('billing')) {
        userMessage = 'The AI service is currently unavailable. Please try again later.'
      } else if (errMsg.includes('content') || errMsg.includes('safety') || errMsg.includes('policy')) {
        userMessage = 'The AI could not process this image. Please make sure the photo is clear and shows a document.'
      } else {
        userMessage = `AI analysis failed. Please try again with clearer photos taken from a well-lit area.`
      }
      return NextResponse.json(
        { error: userMessage },
        { status: 502 }
      )
    }

    const content = response.choices[0]?.message?.content

    if (!content) {
      return NextResponse.json(
        { error: 'No response from vision model. Please try again.' },
        { status: 502 }
      )
    }

    // Parse the JSON response - handle potential markdown code fences
    let cleanedContent = content.trim()
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent
        .replace(/^```(?:json)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '')
        .trim()
    }

    let parsed
    try {
      parsed = JSON.parse(cleanedContent)
    } catch {
      // If JSON parse fails, return the raw content for the frontend to handle
      console.log('[scan-case-plan] JSON parse failed, returning raw content')
      return NextResponse.json({
        success: true,
        raw: true,
        content: cleanedContent,
      })
    }

    console.log(`[scan-case-plan] Successfully extracted data: ${parsed.requirements?.length || 0} requirements, ${parsed.courtDates?.length || 0} court dates`)

    return NextResponse.json({
      success: true,
      raw: false,
      data: parsed,
    })
  } catch (error) {
    console.error('[scan-case-plan] Unexpected error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to analyze case plan: ${errMsg}` },
      { status: 500 }
    )
  }
}

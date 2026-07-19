import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get('file') || 'reunify-1.0.0.aab';
    
    // Only allow specific files for security
    const allowedFiles = [
      'reunify-1.0.0.aab',
      'reunify-1.0.0.apk',
      'reunify-1.0.0.zip',
      'reunify-1.1.0.aab',
      'reunify-1.1.0.apk',
      'reunify-1.1.0.zip',
    ];
    
    if (!allowedFiles.includes(file)) {
      return NextResponse.json({ error: 'File not allowed' }, { status: 403 });
    }
    
    const filePath = join(process.cwd(), 'public', 'play-store', file);
    
    let fileBuffer: Buffer;
    let fileSize: number;
    
    try {
      fileBuffer = readFileSync(filePath);
      fileSize = statSync(filePath).size;
    } catch {
      return NextResponse.json({ 
        error: 'File not found', 
        message: `${file} has not been built yet.` 
      }, { status: 404 });
    }
    
    // Determine content type
    const contentTypes: Record<string, string> = {
      '.aab': 'application/octet-stream',
      '.apk': 'application/vnd.android.package-archive',
      '.zip': 'application/zip',
    };
    
    const ext = file.substring(file.lastIndexOf('.'));
    const contentType = contentTypes[ext] || 'application/octet-stream';
    
    // Force download with Content-Disposition header
    // This is crucial for iPad Safari which may not handle .aab files
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file}"`,
        'Content-Length': fileSize.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

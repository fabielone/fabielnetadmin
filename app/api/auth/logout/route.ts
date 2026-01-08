import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('admin_session_token')?.value

  if (sessionToken) {
    await destroySession(sessionToken)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session_token')

  return response
}

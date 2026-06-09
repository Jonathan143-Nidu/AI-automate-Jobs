import { NextRequest } from 'next/server';

/**
 * Mobile Guard Helper
 * This function checks if the visitor is on a mobile device.
 * If they are mobile, it returns a "Desktop Only" HTML response.
 */
export function checkMobile(request: NextRequest) {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (isMobile) {
        return new Response(
            `<html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f8f9fa; color: #333; margin: 0; padding: 20px; text-align: center;">
          <div style="max-width: 400px; padding: 40px; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: #d9534f; margin-bottom: 20px;">Desktop Only</h1>
            <p style="font-size: 18px; line-height: 1.6;">This Resume Maker is designed for a professional experience on desktop computers and laptops.</p>
            <p style="font-weight: bold; margin-top: 20px;">Please switch to a computer to continue.</p>
          </div>
        </body>
      </html>`,
            {
                headers: { 'content-type': 'text/html' },
            }
        );
    }

    return null; // Not mobile, stay out of the way
}

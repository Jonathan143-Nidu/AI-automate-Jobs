import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

// Dice supports: ONE(1d), THREE(3d), SEVEN(7d)
const DICE_DATE_MAP: Record<string, string> = {
  '1': 'ONE', '2': 'ONE', '3': 'THREE', '7': 'SEVEN',
  '10': 'SEVEN', '15': 'SEVEN', '30': 'SEVEN',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, location, workplace_types, employment_types,
            willing_to_sponsor, easy_apply, posted_days = '1',
            jobs_per_page = 10, page_number = 1 } = body;

    if (!keyword?.trim()) return NextResponse.json({ error: 'keyword is required' }, { status: 400 });

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });

    const posted_date = DICE_DATE_MAP[String(posted_days)] || 'ONE';
    const parts: string[] = [`Search Dice jobs for: "${keyword.trim()}"`];
    if (location) parts.push(`location: ${location}`);
    if (workplace_types?.length) parts.push(`workplace: ${workplace_types.join(', ')}`);
    if (employment_types?.length) parts.push(`employment type: ${employment_types.join(', ')}`);
    parts.push(`posted within: ${posted_date}`);
    if (easy_apply) parts.push('easy apply only');
    if (willing_to_sponsor) parts.push('visa sponsorship required');
    parts.push(`page ${page_number}, ${jobs_per_page} results per page`);

    const userMessage = parts.join(', ') + '. Return ONLY the raw JSON. No explanation.';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'mcp-client-2025-04-04',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: 'You are a job search assistant. Use the Dice MCP tool to search for jobs. Return ONLY the raw JSON from the tool result with no extra text.',
        messages: [{ role: 'user', content: userMessage }],
        mcp_servers: [{ type: 'url', url: 'https://mcp.dice.com/mcp', name: 'dice' }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Anthropic Error Body]:', errorBody);
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
    }
    const data = await response.json();
    const toolResult = data.content?.find((b: { type: string }) => b.type === 'mcp_tool_result');
    let jobsJson = toolResult?.content?.[0]?.text || null;
    if (!jobsJson) {
      const tb = data.content?.find((b: { type: string; text?: string }) => b.type === 'text' && b.text?.includes('"data"'));
      jobsJson = tb?.text || null;
    }
    if (!jobsJson) throw new Error('No job data returned');

    // Handle Rate Limit or Text-based error messages from the Tool
    if (jobsJson.includes('Rate limit') || jobsJson.includes('Too many requests')) {
      throw new Error('Dice is currently experiencing high traffic. Please wait 60 seconds and try again.');
    }

    const clean = jobsJson.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    try {
      return NextResponse.json(JSON.parse(clean));
    } catch (parseError) {
      console.error('[JSON Parse Error]:', jobsJson);
      throw new Error('Failed to parse job data from Dice. Please try a more specific keyword.');
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    let userFriendlyMessage = `Job search failed: ${message}`;
    
    // Catch-all for specialized Dice/MCP server issues
    if (message.includes('timed out') && message.includes('MCP')) {
      userFriendlyMessage = "The Specialized Technical Server (Dice) is currently under high load. Please try again in 5 minutes or use the 'LinkedIn Direct' tab.";
    } else if (message.includes('Rate limit')) {
      userFriendlyMessage = "Rate limit reached for technical specialized search. Please wait 60 seconds.";
    }

    return NextResponse.json({ error: userFriendlyMessage }, { status: 500 });
  }
}

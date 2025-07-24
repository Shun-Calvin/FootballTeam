import { NextResponse } from 'next/server'

// This route acts as a proxy to bypass CORS issues from the external API.
export async function GET() {
  try {
    // Fetch data from the external API on the server-side.
    const response = await fetch('https://data.smartplay.lcsd.gov.hk/rest/cms/api/v1/publ/contents/open-data/turf-soccer-pitch/file', {
      headers: {
        'Accept': 'application/json',
      },
    });

    // Check if the external API call was successful.
    if (!response.ok) {
      // If not, throw an error with the status text.
      throw new Error(`Failed to fetch data from external API: ${response.statusText}`);
    }

    // Parse the JSON data from the response.
    const data = await response.json();

    // Return the data to the client with a 200 OK status.
    return NextResponse.json(data);
  } catch (error) {
    // Log the error to the server console for debugging.
    console.error('API Route Error:', error);
    
    // Return an error response to the client.
    return NextResponse.json(
      { message: 'An error occurred while fetching data.' },
      { status: 500 }
    );
  }
}

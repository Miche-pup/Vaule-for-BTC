import { NextResponse } from 'next/server';
import { getSupabaseServiceRoleClient, getSupabaseAnonClient } from '@/lib/supabaseClient';

// GET handler to fetch all ideas
export async function GET() {
  try {
    // Get Supabase client
    const supabase = getSupabaseAnonClient();
    console.log('Fetching ideas from Supabase');

    // Fetch ideas from the database
    const { data, error } = await supabase
      .from('ideas')
      .select('id, text_content, submitter_name, submitter_ln_address, submitter_contact_info, total_sats_voted, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to fetch ideas. Please try again.' },
        { status: 500 }
      );
    }

    console.log(`Successfully fetched ${data.length} ideas`);

    // Return success response with the ideas
    return NextResponse.json(
      { ideas: data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new idea
export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Received request body:', body);
    
    const { text_content, submitter_name, submitter_ln_address, submitter_contact_info } = body;

    // Validate required fields
    if (!text_content || text_content.trim() === '') {
      return NextResponse.json(
        { error: 'Idea text content is required.' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = getSupabaseServiceRoleClient();
    console.log('Supabase client obtained');

    // Insert the idea into the database
    const { data, error } = await supabase
      .from('ideas')
      .insert([
        {
          text_content,
          submitter_name,
          submitter_ln_address,
          submitter_contact_info,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json(
        { error: 'Failed to submit idea. Please try again.' },
        { status: 500 }
      );
    }

    console.log('Successfully inserted idea:', data);

    // Return success response with the created idea
    return NextResponse.json(
      {
        message: 'Idea submitted successfully',
        idea: {
          id: data.id,
          text_content: data.text_content,
          created_at: data.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
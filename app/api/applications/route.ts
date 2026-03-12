import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';
import { generateAccessCode } from '@/lib/utils';
import { isValidEmail } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = supabaseAdmin
    .from('volunteer_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications: data });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      university,
      field_of_study,
      preferred_blocks,
      motivation,
      skills,
      how_heard,
    } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check for existing application
    const { data: existing } = await supabaseAdmin
      .from('volunteer_applications')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existing && existing.status !== 'rejected') {
      return NextResponse.json(
        { error: 'An application with this email already exists.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('volunteer_applications')
      .insert({
        name,
        email,
        phone,
        university,
        field_of_study,
        preferred_blocks: preferred_blocks || [],
        motivation,
        skills,
        how_heard,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ application: data, success: true });
  } catch (err) {
    console.error('Application submission error:', err);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, admin_notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    // Update application status
    const { data: app, error: updateError } = await supabaseAdmin
      .from('volunteer_applications')
      .update({
        status,
        admin_notes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If accepted, create Alphanaut account
    if (status === 'accepted' && app) {
      let accessCode = generateAccessCode();
      let attempts = 0;
      while (attempts < 10) {
        const { data: existing } = await supabaseAdmin
          .from('alphanauts')
          .select('id')
          .eq('access_code', accessCode)
          .single();
        if (!existing) break;
        accessCode = generateAccessCode();
        attempts++;
      }

      const { data: alphanaut, error: alphanautError } = await supabaseAdmin
        .from('alphanauts')
        .insert({
          name: app.name,
          email: app.email,
          phone: app.phone,
          university: app.university,
          field_of_study: app.field_of_study,
          access_code: accessCode,
          role: 'alphanaut',
          is_active: true,
          is_public: false,
        })
        .select()
        .single();

      if (alphanautError) {
        return NextResponse.json({ error: 'Application accepted but failed to create account: ' + alphanautError.message }, { status: 500 });
      }

      // Log activity
      await supabaseAdmin.from('activity_log').insert({
        actor_type: 'admin',
        action: 'accept_application',
        entity_type: 'alphanaut',
        entity_id: alphanaut.id,
        details: { application_id: id, access_code: accessCode },
      });

      return NextResponse.json({
        application: app,
        alphanaut,
        accessCode,
        success: true,
      });
    }

    return NextResponse.json({ application: app, success: true });
  } catch (err) {
    console.error('Application update error:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
